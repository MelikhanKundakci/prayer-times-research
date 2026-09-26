"""Recreate the numeric coefficient JSON from pinned BSD pvlib spa.py."""
import ast
import hashlib
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
SOURCE = HERE / "vendor" / "spa.py"
EXPECTED_SHA256 = "ad7762ccca5fd9611ef9e2a9b1e37f95fe4c5b31628616b2ad3e84ea1e5f9202"
NAMES = {
    *(f"L{i}" for i in range(6)),
    "B0", "B1",
    *(f"R{i}" for i in range(5)),
    "NUTATION_ABCD_ARRAY", "NUTATION_YTERM_ARRAY",
}

source = SOURCE.read_bytes()
digest = hashlib.sha256(source).hexdigest()
if digest != EXPECTED_SHA256:
    raise SystemExit(f"Unexpected pvlib source SHA-256: {digest}")

trees = ast.parse(source)
tables = {}
for node in trees.body:
    if not (isinstance(node, ast.Assign) and len(node.targets) == 1
            and isinstance(node.targets[0], ast.Name)):
        continue
    name = node.targets[0].id
    if name in NAMES:
        if not isinstance(node.value, ast.Call) or not node.value.args:
            raise SystemExit(f"Unexpected coefficient assignment for {name}")
        tables[name] = ast.literal_eval(node.value.args[0])

if tables.keys() != NAMES:
    raise SystemExit(f"Coefficient table mismatch: {sorted(NAMES - tables.keys())}")
if len(tables["NUTATION_ABCD_ARRAY"]) != 63 or len(tables["NUTATION_YTERM_ARRAY"]) != 63:
    raise SystemExit("Expected the complete 63-term nutation series")

(HERE / "coefficients.json").write_text(
    json.dumps(tables, separators=(",", ":")) + "\n", encoding="utf-8"
)
