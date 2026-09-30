# -*- coding: utf-8 -*-
"""Read LuaJIT 2 bytecode dumps and rebuild template tables."""
import struct
from pathlib import Path


class Reader:
    def __init__(self, data: bytes):
        self.data = data
        self.pos = 0

    def u8(self):
        value = self.data[self.pos]
        self.pos += 1
        return value

    def take(self, size):
        chunk = self.data[self.pos : self.pos + size]
        self.pos += size
        return chunk

    def uleb(self):
        value = 0
        shift = 0
        while True:
            byte = self.u8()
            value |= (byte & 0x7F) << shift
            if byte < 0x80:
                return value
            shift += 7


KGC_CHILD, KGC_TAB, KGC_I64, KGC_U64, KGC_COMPLEX, KGC_STR = range(6)
KTAB_NIL, KTAB_FALSE, KTAB_TRUE, KTAB_INT, KTAB_NUM, KTAB_STR = range(6)


def as_float(lo, hi):
    return struct.unpack("<d", struct.pack("<II", lo & 0xFFFFFFFF, hi & 0xFFFFFFFF))[0]


def read_ktab_value(reader):
    kind = reader.uleb()
    if kind >= KTAB_STR:
        return reader.take(kind - KTAB_STR).decode("utf-8", "replace")
    if kind == KTAB_INT:
        value = reader.uleb()
        if value >= 0x80000000:
            value -= 0x100000000
        return value
    if kind == KTAB_NUM:
        return as_float(reader.uleb(), reader.uleb())
    if kind == KTAB_TRUE:
        return True
    if kind == KTAB_FALSE:
        return False
    if kind == KTAB_NIL:
        return None
    raise ValueError("unknown table value type %s" % kind)


def read_table(reader):
    array_size = reader.uleb()
    hash_size = reader.uleb()
    array = [read_ktab_value(reader) for _ in range(array_size)]
    mapping = {}
    for _ in range(hash_size):
        key = read_ktab_value(reader)
        mapping[key] = read_ktab_value(reader)
    if mapping:
        return mapping
    return array


def read_proto(reader, dump_flags):
    length = reader.uleb()
    if length == 0:
        return None
    start = reader.pos
    reader.u8()
    reader.u8()
    reader.u8()
    size_uv = reader.u8()
    size_kgc = reader.uleb()
    size_kn = reader.uleb()
    size_bc = reader.uleb()
    debug_size = 0
    if not (dump_flags & 0x02):
        debug_size = reader.uleb()
        if debug_size:
            reader.uleb()
            reader.uleb()
    reader.take(size_bc * 4)
    reader.take(size_uv * 2)
    constants = []
    for _ in range(size_kgc):
        kind = reader.uleb()
        if kind >= KGC_STR:
            constants.append(reader.take(kind - KGC_STR).decode("utf-8", "replace"))
        elif kind == KGC_TAB:
            constants.append(read_table(reader))
        elif kind == KGC_CHILD:
            constants.append(None)
        elif kind == KGC_COMPLEX:
            reader.uleb()
            reader.uleb()
            reader.uleb()
            reader.uleb()
        elif kind in (KGC_I64, KGC_U64):
            reader.uleb()
            reader.uleb()
        else:
            raise ValueError("unknown constant type %s" % kind)
    for _ in range(size_kn):
        raw = reader.uleb()
        if raw & 1:
            reader.uleb()
    if debug_size:
        reader.take(debug_size)
    if reader.pos - start != length:
        raise ValueError("prototype length mismatch in bytecode")
    return constants


def load_bytecode(path):
    reader = Reader(Path(path).read_bytes())
    if reader.take(3) != b"\x1bLJ":
        raise ValueError("not LuaJIT bytecode: %s" % path)
    reader.u8()
    flags = reader.u8()
    if not (flags & 0x02):
        reader.take(reader.uleb())
    protos = []
    while True:
        constants = read_proto(reader, flags)
        if constants is None:
            break
        protos.append(constants)
    return protos[-1]


def rows_by_schema(path, id_field):
    constants = load_bytecode(path)
    tables = [item for item in constants if isinstance(item, (dict, list))]
    schema = next(
        item
        for item in tables
        if isinstance(item, dict) and item and all(isinstance(value, int) for value in item.values()) and id_field in item
    )
    records = []
    for item in tables:
        if not isinstance(item, list):
            continue
        if schema[id_field] >= len(item):
            continue
        record = {key: item[index] if index < len(item) else None for key, index in schema.items()}
        if record.get(id_field) not in (None, 0, ""):
            records.append(record)
    return records
