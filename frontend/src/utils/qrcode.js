// Generador de Código QR en JavaScript puro (sin dependencias externas)
// Basado en la especificación QR Code ISO/IEC 18004

const PAD0 = 0xec;
const PAD1 = 0x11;

const QRMode = { MODE_NUMBER: 1, MODE_ALPHA_NUM: 2, MODE_8BIT_BYTE: 4 };
const QRErrorCorrectLevel = { L: 1, M: 0, Q: 3, H: 2 };

class QRPolynomial {
  constructor(num, shift) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[offset + i];
    for (let i = 0; i < shift; i++) this.num[num.length - offset + i] = 0;
  }
  get(index) { return this.num[index]; }
  getLength() { return this.num.length; }
  multiply(e) {
    const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= QRMath.gmult(this.get(i), e.get(j));
      }
    }
    return new QRPolynomial(num, 0);
  }
  mod(e) {
    if (this.getLength() - e.getLength() < 0) return this;
    const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
    const num = new Array(this.getLength());
    for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
    for (let i = 0; i < e.getLength(); i++) {
      num[i] ^= QRMath.gmult(e.get(i), QRMath.gexp(ratio));
    }
    return new QRPolynomial(num, 0).mod(e);
  }
}

const QRMath = {
  glog(n) {
    if (n < 1) throw new Error('glog(' + n + ')');
    return QRMath.LOG_TABLE[n];
  },
  gexp(n) {
    while (n < 0) n += 255;
    while (n >= 255) n -= 255;
    return QRMath.EXP_TABLE[n];
  },
  gmult(a, b) {
    if (a === 0 || b === 0) return 0;
    return QRMath.gexp(QRMath.glog(a) + QRMath.glog(b));
  },
  EXP_TABLE: new Array(256),
  LOG_TABLE: new Array(256),
};

for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
for (let i = 8; i < 256; i++) {
  QRMath.EXP_TABLE[i] =
    QRMath.EXP_TABLE[i - 4] ^
    QRMath.EXP_TABLE[i - 5] ^
    QRMath.EXP_TABLE[i - 6] ^
    QRMath.EXP_TABLE[i - 8];
}
for (let i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

class QRBitBuffer {
  constructor() {
    this.buffer = [];
    this.length = 0;
  }
  get(index) {
    const bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1;
  }
  put(num, length) {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  }
  putBit(bit) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) this.buffer.push(0);
    if (bit) this.buffer[bufIndex] |= 0x80 >>> (this.length % 8);
    this.length++;
  }
}

class QR8bitByte {
  constructor(data) {
    this.mode = QRMode.MODE_8BIT_BYTE;
    this.data = data;
  }
  getLength() { return this.data.length; }
  write(buffer) {
    for (let i = 0; i < this.data.length; i++) {
      buffer.put(this.data.charCodeAt(i), 8);
    }
  }
}

// Tablas de bloques RS para versiones 1-10
const RS_BLOCK_TABLE = [
  // L, M, Q, H
  [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9], // v1
  [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16], // v2
  [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13], // v3
  [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9], // v4
  [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12], // v5
  [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15], // v6
  [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14], // v7
  [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15], // v8
  [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13], // v9
  [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16] // v10
];

function getRSBlocks(typeNumber, errorCorrectLevel) {
  const ecIndex = errorCorrectLevel === QRErrorCorrectLevel.L ? 0 :
                  errorCorrectLevel === QRErrorCorrectLevel.M ? 1 :
                  errorCorrectLevel === QRErrorCorrectLevel.Q ? 2 : 3;
  const row = RS_BLOCK_TABLE[(typeNumber - 1) * 4 + ecIndex];
  const list = [];
  for (let i = 0; i < row.length; i += 3) {
    const count = row[i];
    const totalCount = row[i + 1];
    const dataCount = row[i + 2];
    for (let j = 0; j < count; j++) {
      list.push({ totalCount, dataCount });
    }
  }
  return list;
}

export class QRCodeModel {
  constructor(typeNumber, errorCorrectLevel) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
    this.modules = null;
    this.moduleCount = 0;
    this.dataList = [];
  }

  addData(data) {
    this.dataList.push(new QR8bitByte(data));
  }

  isDark(row, col) {
    if (this.modules[row][col] != null) return this.modules[row][col];
    return false;
  }

  getModuleCount() {
    return this.moduleCount;
  }

  make() {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = new Array(this.moduleCount);
    for (let row = 0; row < this.moduleCount; row++) {
      this.modules[row] = new Array(this.moduleCount).fill(null);
    }

    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this.moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(false, 0);

    const data = QRCodeModel.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
    this.mapData(data, 0);
  }

  setupPositionProbePattern(row, col) {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue;
        if (
          (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4)
        ) {
          this.modules[row + r][col + c] = true;
        } else {
          this.modules[row + r][col + c] = false;
        }
      }
    }
  }

  setupTimingPattern() {
    for (let r = 8; r < this.moduleCount - 8; r++) {
      if (this.modules[r][6] != null) continue;
      this.modules[r][6] = r % 2 === 0;
    }
    for (let c = 8; c < this.moduleCount - 8; c++) {
      if (this.modules[6][c] != null) continue;
      this.modules[6][c] = c % 2 === 0;
    }
  }

  setupPositionAdjustPattern() {
    const pos = [
      [],
      [6, 18],
      [6, 22],
      [6, 26],
      [6, 30],
      [6, 34],
      [6, 22, 38],
      [6, 24, 42],
      [6, 26, 46],
      [6, 28, 50],
      [6, 30, 54]
    ][this.typeNumber - 1] || [];

    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        const row = pos[i];
        const col = pos[j];
        if (this.modules[row][col] != null) continue;

        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (
              Math.abs(r) === 2 ||
              Math.abs(c) === 2 ||
              (r === 0 && c === 0)
            ) {
              this.modules[row + r][col + c] = true;
            } else {
              this.modules[row + r][col + c] = false;
            }
          }
        }
      }
    }
  }

  setupTypeInfo(test, maskPattern) {
    const data = (this.errorCorrectLevel << 3) | maskPattern;
    const bits = QRCodeModel.getBCHTypeInfo(data);

    for (let i = 0; i < 15; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      if (i < 6) this.modules[i][8] = mod;
      else if (i < 8) this.modules[i + 1][8] = mod;
      else this.modules[this.moduleCount - 15 + i][8] = mod;
    }

    for (let i = 0; i < 15; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
      else if (i < 9) this.modules[8][15 - i - 1 + 1] = mod;
      else this.modules[8][15 - i - 1] = mod;
    }
    this.modules[this.moduleCount - 8][8] = !test;
  }

  mapData(data) {
    let inc = -1;
    let row = this.moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;

    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--;

      while (true) {
        for (let c = 0; c < 2; c++) {
          if (this.modules[row][col - c] == null) {
            let dark = false;
            if (byteIndex < data.length) {
              dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
            }
            if ((row + (col - c)) % 2 === 0) dark = !dark;
            this.modules[row][col - c] = dark;
            bitIndex--;
            if (bitIndex === -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }

        row += inc;
        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }

  static createData(typeNumber, errorCorrectLevel, dataList) {
    const rsBlocks = getRSBlocks(typeNumber, errorCorrectLevel);
    const buffer = new QRBitBuffer();

    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i];
      buffer.put(data.mode, 4);
      buffer.put(data.getLength(), 8);
      data.write(buffer);
    }

    let totalDataCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;

    if (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);
    while (buffer.length % 8 !== 0) buffer.putBit(false);

    while (true) {
      if (buffer.length >= totalDataCount * 8) break;
      buffer.put(PAD0, 8);
      if (buffer.length >= totalDataCount * 8) break;
      buffer.put(PAD1, 8);
    }

    return QRCodeModel.createBytes(buffer, rsBlocks);
  }

  static createBytes(buffer, rsBlocks) {
    let offset = 0;
    let maxDcCount = 0;
    let maxEcCount = 0;
    const dcdata = new Array(rsBlocks.length);
    const ecdata = new Array(rsBlocks.length);

    for (let r = 0; r < rsBlocks.length; r++) {
      const dcCount = rsBlocks[r].dataCount;
      const ecCount = rsBlocks[r].totalCount - dcCount;
      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);

      dcdata[r] = new Array(dcCount);
      for (let i = 0; i < dcdata[r].length; i++) {
        dcdata[r][i] = 0xff & buffer.buffer[i + offset];
      }
      offset += dcCount;

      const rsPoly = QRCodeModel.getErrorCorrectPolynomial(ecCount);
      const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);
      ecdata[r] = new Array(rsPoly.getLength() - 1);
      for (let i = 0; i < ecdata[r].length; i++) {
        const modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
      }
    }

    const data = [];
    for (let i = 0; i < maxDcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < dcdata[r].length) data.push(dcdata[r][i]);
      }
    }
    for (let i = 0; i < maxEcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < ecdata[r].length) data.push(ecdata[r][i]);
      }
    }
    return data;
  }

  static getErrorCorrectPolynomial(errorCorrectLength) {
    let a = new QRPolynomial([1], 0);
    for (let i = 0; i < errorCorrectLength; i++) {
      a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
    }
    return a;
  }

  static getBCHTypeInfo(data) {
    let d = data << 10;
    while (QRCodeModel.getBCHDigit(d) - QRCodeModel.getBCHDigit(1335) >= 0) {
      d ^= 1335 << (QRCodeModel.getBCHDigit(d) - QRCodeModel.getBCHDigit(1335));
    }
    return ((data << 10) | d) ^ 21522;
  }

  static getBCHDigit(data) {
    let digit = 0;
    while (data !== 0) {
      digit++;
      data >>>= 1;
    }
    return digit;
  }
}

// Crea la matriz QR eligiendo automáticamente la versión adecuada (1 a 10)
export function createQrMatrix(text) {
  // Capacidad de bytes para nivel L en versiones 1 a 10
  const capacities = [17, 32, 53, 78, 106, 134, 154, 192, 230, 271];
  let version = 1;
  while (version <= 10 && text.length > capacities[version - 1]) {
    version++;
  }
  if (version > 10) version = 10;

  const qr = new QRCodeModel(version, QRErrorCorrectLevel.L);
  qr.addData(text);
  qr.make();
  return qr;
}

