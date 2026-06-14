#!/usr/bin/env bash
# Fetches the menu photos Post B/C need into _img/.
# Requires the Supabase storage host to be on the environment's network egress allowlist:
#   qcqgtcsjoacuktcewpvo.supabase.co
set -e
cd "$(dirname "$0")"; mkdir -p _img
B="https://qcqgtcsjoacuktcewpvo.supabase.co/storage/v1/object/public/nomenclature-photos"
dl(){ curl -fsS -o "_img/$1" "$2" && echo "got $1"; }

dl manakish-zaatar.webp "$B/40024674-0be3-4e0e-ba0c-f44547b2ad54/menu-1XfRn_22MClnd3CfFsJWGShw-OYndHnzJ.webp"
dl manakish-lamb.webp   "$B/51891d3c-8596-4e21-b07a-c82505d356de/menu-1jBkCBYQd0Jrh7bxKwpKQHOr_66ZeY3bl.webp"
dl manakish-cheese.webp "$B/110b6ab6-2904-468e-8ea5-64f356e1ed43/menu-1kR1vmwr8u2-417Jid0g59UbCi8FAL3P6.webp"  # chilli & cheese
# smoothies (colourful trio)
dl smoothie-1.webp "$B/b42dc655-60bc-434e-a82a-b9c09a7d589a/menu-1fjRbQ2UZXwe1pVAyOvOyO-wTfBdAbJaG.webp"  # mango strawberry
dl smoothie-2.webp "$B/8055f4d5-33df-46f6-8b3e-833d6c9a4c2d/menu-1Kzq6rifdrGyEILpjpyHsJFl0bljeD-4I.webp"  # mixed berry
dl smoothie-3.webp "$B/260c3da2-2bf5-4fe1-8733-56d1572699a9/menu-1H3Or1LUpFghMmZm73l_AunhxK2iF1IC6.webp"  # green ice
echo "done -> run: python3 render.py"
