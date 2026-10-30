const fs = require('fs');
const path = require('path');

function patchElfFile(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r+');
    const header = Buffer.alloc(64);
    const bytesRead = fs.readSync(fd, header, 0, 64, 0);

    if (bytesRead < 64 || header.toString('utf8', 0, 4) !== '\x7fELF') {
      fs.closeSync(fd);
      return false;
    }

    const elfClass = header[4]; // 1 = 32-bit, 2 = 64-bit
    if (elfClass !== 2) {
      // Google Play 16 KB page size enforcement is for 64-bit architectures (arm64-v8a, x86_64)
      fs.closeSync(fd);
      return false;
    }

    const endian = header[5]; // 1 = little endian, 2 = big endian
    const isLittle = endian === 1;

    // e_phoff is at byte 32 (8 bytes)
    const phOff = isLittle ? header.readBigUInt64LE(32) : header.readBigUInt64BE(32);
    // e_phentsize is at byte 54 (2 bytes), e_phnum is at byte 56 (2 bytes)
    const phEntSize = isLittle ? header.readUInt16LE(54) : header.readUInt16BE(54);
    const phNum = isLittle ? header.readUInt16LE(56) : header.readUInt16BE(56);

    let patched = false;
    const phdrBuf = Buffer.alloc(phEntSize);

    for (let i = 0; i < phNum; i++) {
      const entryOffset = Number(phOff) + (i * phEntSize);
      fs.readSync(fd, phdrBuf, 0, phEntSize, entryOffset);

      const pType = isLittle ? phdrBuf.readUInt32LE(0) : phdrBuf.readUInt32BE(0);
      if (pType === 1) { // PT_LOAD
        // In 64-bit Elf64_Phdr:
        // p_type(4), p_flags(4), p_offset(8), p_vaddr(8), p_paddr(8), p_filesz(8), p_memsz(8), p_align(8)
        // p_align is at offset 48
        const pAlign = isLittle ? phdrBuf.readBigUInt64LE(48) : phdrBuf.readBigUInt64BE(48);

        if (pAlign < 16384n) { // Less than 16 KB (e.g. 4096 = 0x1000)
          const newAlignBuf = Buffer.alloc(8);
          if (isLittle) {
            newAlignBuf.writeBigUInt64LE(16384n, 0);
          } else {
            newAlignBuf.writeBigUInt64BE(16384n, 0);
          }
          fs.writeSync(fd, newAlignBuf, 0, 8, entryOffset + 48);
          patched = true;
        }
      }
    }

    fs.closeSync(fd);
    if (patched) {
      console.log(`[16KB PATCHED] ${filePath}`);
      return true;
    }
  } catch (err) {
    console.error(`[ERROR] ${filePath}:`, err.message);
  }
  return false;
}

function scanAndPatch(targetDir) {
  if (!fs.existsSync(targetDir)) {
    console.log(`[WARN] Target directory does not exist: ${targetDir}`);
    return;
  }
  let count = 0;
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.so')) {
        if (patchElfFile(fullPath)) {
          count++;
        }
      }
    }
  }
  walk(targetDir);
  console.log(`Total .so files patched to 16KB in ${targetDir}: ${count}`);
}

const target = process.argv[2];
if (target) {
  scanAndPatch(path.resolve(target));
} else {
  console.log('Usage: node patch_elf_16kb.js <directory>');
}

