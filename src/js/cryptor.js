var Cryptor = Class.create({
	initialize : function(){
		this._key = [121, 57, 121, 100, 80, 8, 34, 19, 88, 24, 117, 89, 3, 116, 105, 51];
	},
	encrypt : function(plainText){
		return byteArrayToHex(rijndaelEncrypt(plainText,this._key, 'ECB'));
	},
	decrypt : function(encryptedText){
		return byteArrayToString(rijndaelDecrypt(hexToByteArray(encryptedText), this._key, 'ECB'));
	},
});