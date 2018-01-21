/*!
 *  Copyright � 2008 Fair Oaks Labs, Inc.
 *  All rights reserved.
 */

// Utility object:  Encode/Decode C-style binary primitives to/from octet arrays
(function(){
  function JSPack()  {
	
	// Module-level (private) variables
	var el,  
		bBE = false, 
		m = this;


	// Raw byte arrays
	m._DeArray = function (a, p, l)
	{
		return [a.slice(p,p+l)];
	};
	m._EnArray = function (a, p, l, v)
	{
		for (var i = 0; i < l; a[p+i] = v[i]?v[i]:0, i++);
	};

	// ASCII characters
	m._DeChar = function (a, p)
	{
		return String.fromCharCode(a[p]);
	};
	m._EnChar = function (a, p, v)
	{
		a[p] = v.charCodeAt(0);
	};

	// Little-endian (un)signed N-byte integers
	m._DeInt = function (a, p)
	{
		var lsb = bBE ? (el.len-1):0, 
			nsb = bBE ? -1 : 1, 
			stop = lsb + nsb * el.len, 
			rv, i, f;
		for (rv = 0, i = lsb, f = 1; i != stop; rv += (a[p+i]*f), i += nsb, f *= 256);
		if (el.bSigned && (rv & Math.pow(2, el.len*8-1))) { rv -= Math.pow(2, el.len*8); }
		return rv;
	};
	m._EnInt = function (a, p, v)
	{
		var lsb = bBE?(el.len-1):0, nsb = bBE?-1:1, stop = lsb+nsb*el.len, i;
		v = (v<el.min)?el.min:(v>el.max)?el.max:v;
		for (i = lsb; i != stop; a[p+i]=v&0xff, i+=nsb, v>>=8);
	};

	// ASCII character strings
	m._DeString = function (a, p, l)
	{
		for (var rv = new Array(l), i = 0; i < l; rv[i] = String.fromCharCode(a[p+i]), i++);
		return rv.join('');
	};
	m._EnString = function (a, p, l, v)
	{
		for (var t, i = 0; i < l; a[p+i] = (t=v.charCodeAt(i))?t:0, i++);
	};

	// Little-endian N-bit IEEE 754 floating point
	m._De754 = function (a, p)
	{
		var s, e, m, i, d, nBits, mLen, eLen, eBias, eMax;
		mLen = el.mLen, eLen = el.len*8-el.mLen-1, eMax = (1<<eLen)-1, eBias = eMax>>1;

		i = bBE?0:(el.len-1); d = bBE?1:-1; s = a[p+i]; i+=d; nBits = -7;
		for (e = s&((1<<(-nBits))-1), s>>=(-nBits), nBits += eLen; nBits > 0; e=e*256+a[p+i], i+=d, nBits-=8);
		for (m = e&((1<<(-nBits))-1), e>>=(-nBits), nBits += mLen; nBits > 0; m=m*256+a[p+i], i+=d, nBits-=8);

		switch (e)
		{
			case 0:
				// Zero, or denormalized number
				e = 1-eBias;
				break;
			case eMax:
				// NaN, or +/-Infinity
				return m?NaN:((s?-1:1)*Infinity);
			default:
				// Normalized number
				m = m + Math.pow(2, mLen);
				e = e - eBias;
				break;
		}
		return (s?-1:1) * m * Math.pow(2, e-mLen);
	};
	m._En754 = function (a, p, v)
	{
		var s, e, m, i, d, c, mLen, eLen, eBias, eMax;
		mLen = el.mLen, eLen = el.len*8-el.mLen-1, eMax = (1<<eLen)-1, eBias = eMax>>1;

		s = v<0?1:0;
		v = Math.abs(v);
		if (isNaN(v) || (v == Infinity))
		{
			m = isNaN(v)?1:0;
			e = eMax;
		}
		else
		{
			e = Math.floor(Math.log(v)/Math.LN2);			// Calculate log2 of the value
			if (v*(c = Math.pow(2, -e)) < 1) { e--; c*=2; }		// Math.log() isn't 100% reliable

			// Round by adding 1/2 the significand's LSD
			if (e+eBias >= 1) { v += el.rt/c; }			// Normalized:  mLen significand digits
			else { v += el.rt*Math.pow(2, 1-eBias); } 		// Denormalized:  <= mLen significand digits
			if (v*c >= 2) { e++; c/=2; }				// Rounding can increment the exponent

			if (e+eBias >= eMax)
			{
				// Overflow
				m = 0;
				e = eMax;
			}
			else if (e+eBias >= 1)
			{
				// Normalized - term order matters, as Math.pow(2, 52-e) and v*Math.pow(2, 52) can overflow
				m = (v*c-1)*Math.pow(2, mLen);
				e = e + eBias;
			}
			else
			{
				// Denormalized - also catches the '0' case, somewhat by chance
				m = v*Math.pow(2, eBias-1)*Math.pow(2, mLen);
				e = 0;
			}
		}

		for (i = bBE?(el.len-1):0, d=bBE?-1:1; mLen >= 8; a[p+i]=m&0xff, i+=d, m/=256, mLen-=8);
		for (e=(e<<mLen)|m, eLen+=mLen; eLen > 0; a[p+i]=e&0xff, i+=d, e/=256, eLen-=8);
		a[p+i-d] |= s*128;
	};


	// Class data
	m._sPattern	= '(\\d+)?([AxcbBhHsfdiIlL])';
	m._lenLut	= {'A':1, 'x':1, 'c':1, 'b':1, 'B':1, 'h':2, 'H':2, 's':1, 'f':4, 'd':8, 'i':4, 'I':4, 'l':4, 'L':4};
	m._elLut	= {	'A': {en:m._EnArray,  de:m._DeArray},
					's': {en:m._EnString, de:m._DeString},
					'c': {en:m._EnChar,   de:m._DeChar},
					'b': {en:m._EnInt,    de:m._DeInt, len:1, bSigned:true,  min:-Math.pow(2, 7), max:Math.pow(2, 7)-1},
					'B': {en:m._EnInt,    de:m._DeInt, len:1, bSigned:false, min:0, max:Math.pow(2, 8)-1},
					'h': {en:m._EnInt,    de:m._DeInt, len:2, bSigned:true,  min:-Math.pow(2, 15), max:Math.pow(2, 15)-1},
					'H': {en:m._EnInt,    de:m._DeInt, len:2, bSigned:false, min:0, max:Math.pow(2, 16)-1},
					'i': {en:m._EnInt,    de:m._DeInt, len:4, bSigned:true,  min:-Math.pow(2, 31), max:Math.pow(2, 31)-1},
					'I': {en:m._EnInt,    de:m._DeInt, len:4, bSigned:false, min:0, max:Math.pow(2, 32)-1},
					'l': {en:m._EnInt,    de:m._DeInt, len:4, bSigned:true,  min:-Math.pow(2, 31), max:Math.pow(2, 31)-1},
					'L': {en:m._EnInt,    de:m._DeInt, len:4, bSigned:false, min:0, max:Math.pow(2, 32)-1},
					'f': {en:m._En754,    de:m._De754, len:4, mLen:23, rt:Math.pow(2, -24)-Math.pow(2, -77)},
					'd': {en:m._En754,    de:m._De754, len:8, mLen:52, rt:0}};

	// Unpack a series of n elements of size s from array a at offset p with fxn
	m._UnpackSeries = function (n, s, a, p)
	{
		for (var fxn = el.de, rv = [], i = 0; i < n; rv.push(fxn(a, p+i*s)), i++);
		return rv;
	};

	// Pack a series of n elements of size s from array v at offset i to array a at offset p with fxn
	m._PackSeries = function (n, s, a, p, v, i)
	{
		for (var fxn = el.en, o = 0; o < n; fxn(a, p+o*s, v[i+o]), o++);
	};

	// Unpack the octet array a, beginning at offset p, according to the fmt string
	m.Unpack = function (fmt, a, p)
	{
		// Set the private bBE flag based on the format string - assume big-endianness
		bBE = (fmt.charAt(0) != '<');

		p = p ? p : 0;
		var re = new RegExp(this._sPattern, 'g'), m, n, s, rv = [];
		while (m = re.exec(fmt))
		{
			n = ((m[1]==undefined)||(m[1]==''))?1:parseInt(m[1]);
			s = this._lenLut[m[2]];
			if ((p + n*s) > a.length)
			{
				return undefined;
			}
			switch (m[2])
			{
				case 'A': case 's':
					rv.push(this._elLut[m[2]].de(a, p, n));
					break;
				case 'c': case 'b': case 'B': case 'h': case 'H':
				case 'i': case 'I': case 'l': case 'L': case 'f': case 'd':
					el = this._elLut[m[2]];
					rv.push(this._UnpackSeries(n, s, a, p));
					break;
			}
			p += n*s;
		}
		return Array.prototype.concat.apply([], rv);
	};

	// Pack the supplied values into the octet array a, beginning at offset p, according to the fmt string
	m.PackTo = function (fmt, a, p, values)
	{
		// Set the private bBE flag based on the format string - assume big-endianness
		bBE = (fmt.charAt(0) != '<');

		var re = new RegExp(this._sPattern, 'g'), m, n, s, i = 0, j;
		while (m = re.exec(fmt))
		{
			n = ((m[1]==undefined)||(m[1]==''))?1:parseInt(m[1]);
			s = this._lenLut[m[2]];
			if ((p + n*s) > a.length)
			{
				return false;
			}
			switch (m[2])
			{
				case 'A': case 's':
					if ((i + 1) > values.length) { return false; }
					this._elLut[m[2]].en(a, p, n, values[i]);
					i += 1;
					break;
				case 'c': case 'b': case 'B': case 'h': case 'H':
				case 'i': case 'I': case 'l': case 'L': case 'f': case 'd':
					el = this._elLut[m[2]];
					if ((i + n) > values.length) { return false; }
					this._PackSeries(n, s, a, p, values, i);
					i += n;
					break;
				case 'x':
					for (j = 0; j < n; j++) { a[p+j] = 0; }
					break;
			}
			p += n*s;
		}
		return a;
	};

	// Pack the supplied values into a new octet array, according to the fmt string
	m.Pack = function (fmt, values)
	{
		return this.PackTo(fmt, new Array(this.CalcLength(fmt)), 0, values);
	};

	// Determine the number of bytes represented by the format string
	m.CalcLength = function (fmt)
	{
		var re = new RegExp(this._sPattern, 'g'), m, sum = 0;
		while (m = re.exec(fmt))
		{
			sum += (((m[1]==undefined)||(m[1]==''))?1:parseInt(m[1])) * this._lenLut[m[2]];
		}
		return sum;
	};

	// --------------------------------------------------------	
	m.stringToBytes = function (str)	{
		var ch, st, re = [];
		for (var i = 0; i < str.length; i++ ) {
			ch = str.charCodeAt(i);  // get char 
			st = [];                 // set up "stack"
			do {
				st.push( ch & 0xFF );  // push byte to stack
				ch = ch >> 8;          // shift value down by 1 byte
			}  
			while ( ch );
			// add stack contents to result done because chars have "wrong" endianness
			re = re.concat( st.reverse() );
		}
		// return an array of bytes
		return re;
	};
	
	m.ReadByte = function (arr, pos)	{
		var y = this.Unpack('B', arr, pos);
		return y ? y[0] : null;
	};
	m.ReadInt16 = function (arr, pos)	{
		var y = this.Unpack('H', arr, pos);
		return y ? y[0] : null;
	};
	m.ReadInt24 = function (arr, pos)	{
		var x = [0x00, arr[pos], arr[pos+1], arr[pos+2] ];	
		var y = this.Unpack('L', x, 0);
		return y ? y[0] : null;
	};
	m.ReadInt32 = function (arr, pos)	{
		var y = this.Unpack('L', arr, pos);
		return y ? y[0] : null;
	};
	m.ReadInt64 = function (arr, pos)	{
		var hi = arr.slice(pos, pos + 4);
		var lo = arr.slice(pos + 4, pos + 8);
		var y1 = this.Unpack('L', hi, 0);
		var y2 = this.Unpack('L', lo, 0);
		return y1[0] * 4294967295 + y2[0];
	};
	m.ReadDouble = function (arr, pos)	{
		var y = this.Unpack('d', arr, pos);
		return y ? y[0] : null;
	};
	m.ReadString = function (arr, pos)	{
		len = 0;
		while (arr[pos + len] != 0x00)  len++;
		t = arr.slice(pos, pos+len);
		return {arr: t, pos: pos + len + 1};
	};
	
	m.bytesToString = function (array)	{
		var result = "";
		for (var i = 0; i < array.length; i++) {
			result += (String.fromCharCode(array[i]));	
		}
		return result;
	};
	m.WriteByte = function (meta, pos, x)	{
		var y = this.Pack('B', [x]);
		meta[pos] = y[0];
	};
	m.WriteInt24 = function (meta, pos, x)	{
		var x1 = (x & 0xFF0000) >> 16;
		var x2 = (x & 0xFF00) >> 8;
		var x3 = (x & 0xFF);
		
		var y1 = this.Pack('B', [x1]);
		var y2 = this.Pack('B', [x2]);
		var y3 = this.Pack('B', [x3]);
		
		meta[pos] = y1[0];
		meta[pos + 1] = y2[0];
		meta[pos + 2] = y3[0];
	};
	m.WriteInt32 = function (meta, pos, x)	{
		var y = this.Pack('L', [x]);
		meta[pos] = y[0];
		meta[pos + 1] = y[1];
		meta[pos + 2] = y[2];
		meta[pos + 3] = y[3];
	};
	m.WriteBoxSize = function (meta, pos, type, size)	{
		var mm = [];
		mm.push(meta[pos-4]); mm.push(meta[pos-3]); mm.push(meta[pos-2]); mm.push(meta[pos-1]);
		if (this.bytesToString(mm) == type)  {
			this.WriteInt32(meta, pos - 8, size);
		}	
		else  {
          this.WriteInt32(meta, pos - 8, 0);
          this.WriteInt32(meta, pos - 4, size);
        }
	};
	m.WriteFlvTimestamp = function (frag, fragPos, packetTS)	{
		this.WriteInt24(frag, fragPos + 4, (packetTS & 0x00FFFFFF));
		this.WriteByte(frag, fragPos + 7, (packetTS & 0xFF000000) >> 24);		
	};
	// --------------------------------------------------------	
	m.concat = function (a, b)	{
		if (!a) return b;
		if (!b) return a;

		var c = new Uint8Array(a.length + b.length);
		c.set(a);
		c.set(b, a.length);

		return c;
	};
	// --------------------------------------------------------	
	
	
	
  };

  this.jspack = new JSPack();
  
  
	// --------------------------------------------------------	
	function checkInt(value) {
		return (parseInt(value) === value);
	}

	function checkInts(arrayish) {
		if (!checkInt(arrayish.length)) { return false; }

		for (var i = 0; i < arrayish.length; i++) {
			if (!checkInt(arrayish[i]) || arrayish[i] < 0 || arrayish[i] > 255) {
				return false;
			}
		}

		return true;
	}

	function coerceArray(arg, copy) {

		// ArrayBuffer view
		if (arg.buffer && ArrayBuffer.isView(arg) && arg.name === 'Uint8Array') {

			if (copy) {
				if (arg.slice) {
					arg = arg.slice();
				} else {
					arg = Array.prototype.slice.call(arg);
				}
			}

			return arg;
		}

		// It's an array; check it is a valid representation of a byte
		if (Array.isArray(arg)) {
			if (!checkInts(arg)) {
				throw new Error('Array contains invalid value: ' + arg);
			}

			return new Uint8Array(arg);
		}

		// Something else, but behaves like an array (maybe a Buffer? Arguments?)
		if (checkInt(arg.length) && checkInts(arg)) {
			return new Uint8Array(arg);
		}

		throw new Error('unsupported array-like object');
	}

	function createArray(length) {
		return new Uint8Array(length);
	}

	function copyArray(sourceArray, targetArray, targetStart, sourceStart, sourceEnd) {
		if (sourceStart != null || sourceEnd != null) {
			if (sourceArray.slice) {
				sourceArray = sourceArray.slice(sourceStart, sourceEnd);
			} else {
				sourceArray = Array.prototype.slice.call(sourceArray, sourceStart, sourceEnd);
			}
		}
		targetArray.set(sourceArray, targetStart);
	}
	// --------------------------------------------------------	
  
	function convertUtf8()  {
  
		this.toBytes = function(text) {
			var result = [], i = 0;
			text = encodeURI(text);
			while (i < text.length) {
				var c = text.charCodeAt(i++);

				// if it is a % sign, encode the following 2 bytes as a hex value
				if (c === 37) {
					result.push(parseInt(text.substr(i, 2), 16))
					i += 2;

				// otherwise, just the actual byte
				} else {
					result.push(c)
				}
			}

			return coerceArray(result);
		};
	
		this.fromBytes = function(bytes) {
			var result = [], i = 0;

			while (i < bytes.length) {
				var c = bytes[i];

				if (c < 128) {
					result.push(String.fromCharCode(c));
					i++;
				} else if (c > 191 && c < 224) {
					result.push(String.fromCharCode(((c & 0x1f) << 6) | (bytes[i + 1] & 0x3f)));
					i += 2;
				} else {
					result.push(String.fromCharCode(((c & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)));
					i += 3;
				}
			}

			return result.join('');
		};
	};
	this.utf8 = new convertUtf8();
  
	// --------------------------------------------------------	
  
	function convertUtf16()  {
  
		this.toBytes = function(text) {
			
			var buf = new ArrayBuffer(text.length*2);
			var bufView = new Uint16Array(buf);
			for (var i=0, strLen=text.length; i < strLen; i++) {
				bufView[i] = text.charCodeAt(i);
			}
			return bufView;
			
		};
		
		this.fromBytes = function(w) {
			var i = 0;
			var len = w.length;
			var w1, w2;
			var charCodes = [];
			while (i < len) {
				var w1 = w[i++];
				if ((w1 & 0xF800) !== 0xD800) { // w1 < 0xD800 || w1 > 0xDFFF
					charCodes.push(w1);
					continue;
				}
				if ((w1 & 0xFC00) === 0xD800) { // w1 >= 0xD800 && w1 <= 0xDBFF
					//throw new RangeError('Invalid octet 0x' + w1.toString(16) + ' at offset ' + (i - 1));
					continue;
				}
				if (i === len) {
					//throw new RangeError('Expected additional octet');
					continue;
				}
				w2 = w[i++];
				if ((w2 & 0xFC00) !== 0xDC00) { // w2 < 0xDC00 || w2 > 0xDFFF)
					//throw new RangeError('Invalid octet 0x' + w2.toString(16) + ' at offset ' + (i - 1));
					continue;
				}
				//charCodes.push(((w1 & 0x3ff) << 10) + (w2 & 0x3ff) + 0x10000);
			}
			return String.fromCharCode.apply(String, charCodes);		
		};

	};
		
	this.utf16 = new convertUtf16();
  
	// --------------------------------------------------------	
	function convertHex()  {
  
        var Hex = '0123456789abcdef';
	
		this.toBytes = function(text) {
            var result = [];
            for (var i = 0; i < text.length; i += 2) {
                result.push(parseInt(text.substr(i, 2), 16));
            }
            return result;
        }

		this.fromBytes = function(bytes) {
			var result = [];
			for (var i = 0; i < bytes.length; i++) {
				var v = bytes[i];
				result.push(Hex[(v & 0xf0) >> 4] + Hex[v & 0x0f]);
			}
			return result.join(' ');
        }

    };
	this.hex = new convertHex();
	// --------------------------------------------------------	
  
  
		
}).apply( fvdSingleDownloader );

