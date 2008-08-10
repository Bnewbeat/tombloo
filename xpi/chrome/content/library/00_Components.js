var XUL_NS  = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
var HTML_NS = 'http://www.w3.org/1999/xhtml';

var Ci = Components.interfaces;
var Cc = Components.classes;

var INTERFACES = [];
for(var i in Ci)
	INTERFACES.push(Ci[i]);

if(typeof(update)=='undefined'){
	function update(t, s){
		for(var p in s)
			t[p] = s[p];
		return t;
	}
}

var IWebProgressListener = Ci.nsIWebProgressListener;
var IFile                = Ci.nsIFile;
var ILocalFile           = Ci.nsILocalFile;
var IURI                 = Ci.nsIURI;
var IInputStream         = Ci.nsIInputStream;
var ICache               = Ci.nsICache;
var ISelectionListener   = Ci.nsISelectionListener;
// var IAccessNode          = Ci.nsIAccessNode;


// const AccessibilityService = getService('/accessibilityService;1', Ci.nsIAccessibilityService);
var ExtensionManager    = getService('/extensions/manager;1', Ci.nsIExtensionManager);
var StorageService      = getService('/storage/service;1', Ci.mozIStorageService);
var DirectoryService    = getService('/file/directory_service;1', Ci.nsIProperties);
var IOService           = getService('/network/io-service;1', Ci.nsIIOService);
var AtomService         = getService('/atom-service;1', Ci.nsIAtomService);
var ChromeRegistry      = getService('/chrome/chrome-registry;1', Ci.nsIXULChromeRegistry);
var WindowMediator      = getService('/appshell/window-mediator;1', Ci.nsIWindowMediator);
var ConsoleService      = getService('/consoleservice;1', Ci.nsIConsoleService);
var AlertsService       = getService('/alerts-service;1', Ci.nsIAlertsService);
var MIMEService         = getService('/uriloader/external-helper-app-service;1', Ci.nsIMIMEService);
var PromptService       = getService('/embedcomp/prompt-service;1', Ci.nsIPromptService);
var CacheService        = getService('/network/cache-service;1', Ci.nsICacheService);
var AppShellService     = getService('/appshell/appShellService;1', Ci.nsIAppShellService);
var DownloadManager     = getService('/download-manager;1', Ci.nsIDownloadManager);
var AppInfo             = getService('/xre/app-info;1');
var UnescapeHTML        = getService('/feed-unescapehtml;1', Ci.nsIScriptableUnescapeHTML);
var CookieService       = getService('/cookieService;1', Ci.nsICookieService);
var CookieManager       = getService('/cookiemanager;1', Ci.nsICookieManager);
var PasswordManager     = getService('/passwordmanager;1', Ci.nsIPasswordManager);
var LoginManager        = getService('/login-manager;1', Ci.nsILoginManager);
var StringBundleService = getService('/intl/stringbundle;1', Ci.nsIStringBundleService);
var NavBookmarksService = getService('/browser/nav-bookmarks-service;1', Ci.nsINavBookmarksService);
var AnnotationService   = getService('/browser/annotation-service;1', Ci.nsIAnnotationService);
var ObserverService     = getService('/observer-service;1', Ci.nsIObserverService);
var WindowWatcher       = getService('/embedcomp/window-watcher;1', Ci.nsIWindowWatcher);
var ClipboardHelper     = getService('/widget/clipboardhelper;1', Ci.nsIClipboardHelper);
var NavHistoryService   = getService('/browser/nav-history-service;1', Ci.nsINavHistoryService);
var FaviconService      = getService('/browser/favicon-service;1', Ci.nsIFaviconService);


var PrefBranch = 
	createConstructor('/preferences;1', 'nsIPrefBranch');

var LocalFile = 
	createConstructor('/file/local;1', 'nsILocalFile', 'initWithPath');

var WebBrowserPersist = 
	createConstructor('/embedding/browser/nsWebBrowserPersist;1', 'nsIWebBrowserPersist');

var StorageStatementWrapper = 
	createConstructor('/storage/statement-wrapper;1', 'mozIStorageStatementWrapper', 'initialize');

var ScriptError = 
	createConstructor('/scripterror;1', 'nsIScriptError', 'init');

var Process = 
	createConstructor('/process/util;1', 'nsIProcess', 'init');

var FilePicker = 
	createConstructor('/filepicker;1', 'nsIFilePicker', 'init');

var InputStream = 
	createConstructor('/scriptableinputstream;1', 'nsIScriptableInputStream', 'init');

var BinaryInputStream = 
	createConstructor('/binaryinputstream;1', 'nsIBinaryInputStream', 'setInputStream');

var FileInputStream = 
	createConstructor('/network/file-input-stream;1', 'nsIFileInputStream', 'init');

var ConverterInputStream = 
	createConstructor('/intl/converter-input-stream;1', 'nsIConverterInputStream', function(stream, charset, bufferSize){
		this.init(stream, charset || 'UTF-8', bufferSize || 4096, ConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
	});

var MIMEInputStream = 
	createConstructor('/network/mime-input-stream;1', 'nsIMIMEInputStream', function(stream){
		this.addContentLength = true;
		this.setData(stream);
	});

var BufferedInputStream = 
	createConstructor('/network/buffered-input-stream;1', 'nsIBufferedInputStream', function(stream, bufferSize){
		this.init(stream, bufferSize || 4096);
	});

var StringInputStream = 
	createConstructor('/io/string-input-stream;1', 'nsIStringInputStream', function(str){
		this.setData(str, str.length);
	});

var UnicodeConverter = 
	createConstructor('/intl/scriptableunicodeconverter', 'nsIScriptableUnicodeConverter', function(charset){
		this.charset = charset || 'UTF-8';
	});

var MultiplexInputStream = 
	createConstructor('/io/multiplex-input-stream;1', 'nsIMultiplexInputStream', function(streams){
		var self = this;
		streams = streams || [];
		streams.forEach(function(stream){
			if(stream.join)
				stream = stream.join('\r\n');
			
			if(typeof(stream)=='string')
				stream = new StringInputStream(stream + '\r\n');
				
			self.appendStream(stream);
		});
	});

var CryptoHash = 
	createConstructor('/security/hash;1', 'nsICryptoHash', 'init');

var FileOutputStream = 
	update(createConstructor('/network/file-output-stream;1', 'nsIFileOutputStream', 'init'), {
		PR_RDONLY : 0x01,
		PR_WRONLY : 0x02,
		PR_RDWR   : 0x04,
		PR_CREATE_FILE : 0x08,
		PR_APPEND : 0x10,
		PR_TRUNCATE : 0x20,
		PR_SYNC : 0x40,
		PR_EXCL : 0x80,
	});

// ----[Utility]-------------------------------------------------
function createMock(sample, proto){
	var non = function(){};
	sample = typeof(sample)=='object'? sample : Cc[sample].createInstance();
	
	var ifcs = getInterfaces(sample);
	var Mock = function(){};
	
	for(var key in sample){
		try{
			var val = sample[key];
			switch (typeof(val)){
			case 'number':
			case 'string':
				Mock.prototype[key] = val;
				continue;
				
			case 'function':
				Mock.prototype[key] = non;
				continue;
			}
		} catch(e){
			// �R���|�[�l���g�����ɂ�蔭������v���p�e�B�擾�G���[�𖳎�����
		}
	}
	
	Mock.prototype.QueryInterface = createQueryInterface(ifcs);
	
	update(Mock.prototype, proto);
	update(Mock, Mock.prototype);
	
	return Mock;
}

function createQueryInterface(ifcNames){
	var ifcs = ['nsISupports'].concat(ifcNames).map(function(ifcName){
		return Ci[''+ifcName];
	});
	
	return function(iid){
		if(ifcs.some(function(ifc){
			return iid.equals(ifc);
		})){
			return this;
		}
		
		throw Components.results.NS_NOINTERFACE;
	}
}

/**
 * XPCOM�̃R���X�g���N�^�𐶐�����B
 * �R���X�g���N�^�͎w�肳�ꂽ�C���^�[�t�F�[�X�̒萔��S�Ď��B
 *
 * @param {String} clsName �N���X��(@mozilla.org�ȍ~���w�肷��)�B
 * @param {String || nsIJSID} ifc �C���^�[�t�F�C�X�B
 * @param {String || Function} init 
 *        �������֐��B
 *        ������̏ꍇ�A�Y�����郁�\�b�h���Ăяo�����B
 *        �֐��̏ꍇ�A�������ꂽ�C���X�^���X��this�Ƃ��ČĂяo�����B
 */
function createConstructor(clsName, ifc, init){
	var cls = Components.classes['@mozilla.org' + clsName];
	ifc = typeof(ifc)=='string'? Components.interfaces[ifc] : ifc;
	
	var cons = function(){
		var obj = cls.createInstance(ifc);
		if(init){
			if(typeof(init)=='string'){
				obj[init].apply(obj, arguments);
			} else {
				init.apply(obj, arguments);
			}
		}
		return obj;
	};
	
	cons.instanceOf = function(obj){
		return (obj instanceof ifc);
	};
	
	for(var prop in ifc)
		cons[prop] = ifc[prop];
	
	return cons;
}

/**
 * XPCOM�T�[�r�X���擾����B
 * �C���^�[�t�F�[�X���w�肳��Ȃ��ꍇ�A���p�ł���S�ẴC���^�[�t�F�[�X�Ɋg������B
 *
 * @param {String} clsName �N���X��(@mozilla.org�ȍ~���w�肷��)�B
 * @param {nsIJSID} ifc �C���^�[�t�F�C�X�B
 */
function getService(clsName, ifc){
	try{
		var cls = Components.classes['@mozilla.org' + clsName];
		return !cls? null : 
			ifc? cls.getService(ifc) : broad(cls.getService());
	} catch(e) {
		return null;
	}
}

/**
 * XPCOM�C���X�^���X�̎������Ă���C���^�[�t�F�[�X�ꗗ���擾����B
 *
 * @param {Object} obj XPCOM�C���X�^���X�B
 * @return {Array} �C���^�[�t�F�[�X�̃��X�g�B
 */
function getInterfaces(obj){
	var result = [];
	
	for(var i=0,len=INTERFACES.length ; i<len ; i++){
		var ifc = INTERFACES[i];
		if(obj instanceof ifc)
			result.push(ifc);
	}
	
	return result;
}

/**
 * XPCOM�C���X�^���X�̎������Ă���C���^�[�t�F�[�X��S�ė��p�ł���悤�ɂ���B
 * �p�t�H�[�}���X�ɒ��ӂ���ӏ��ł́A�C���^�[�t�F�[�X�̃��X�g��n�������͈͂����肵�Ďg���B
 *
 * @param {Object} obj XPCOM�C���X�^���X�B
 * @param {optional Array} ifcs �C���^�[�t�F�[�X�̃��X�g�B�w�肳��Ȃ��ꍇ�A�S�C���^�[�t�F�C�X�����������B
 */
function broad(obj, ifcs){
	ifcs = ifcs || INTERFACES;
	for(var i=0,len=ifcs.length ; i<len ; i++)
		if(obj instanceof ifcs[i]);
	return obj;
};

/**
 * �ʒm�o�u����\������B
 * ����������G���[�Ȃǂ�ʒm���邽�߂ɗp����B
 * Mac��Firefox 3�ł�Growl�ɂȂ�B
 *
 * @param {String} title �^�C�g���B
 * @param {String} msg ���b�Z�[�W�B
 * @param {String} icon �A�C�R����ށB�萔�̒�����I�����邩�A�Ǝ���URL��n���B
 */
function notify(title, msg, icon){
	AlertsService && AlertsService.showAlertNotification(
		icon, title, msg, 
		false, '', null);
}
notify.ICON_DOWNLOAD = 'chrome://mozapps/skin/downloads/downloadIcon.png';
notify.ICON_INFO     = 'chrome://global/skin/console/bullet-question.png';
notify.ICON_ERROR    = 'chrome://global/skin/console/bullet-error.png';
notify.ICON_WORN     = 'chrome://global/skin/console/bullet-warning.png';

/*
function getElementByPosition(x, y){
	return AccessibilityService.
		getAccessibleFor(currentDocument()).
		getChildAtPoint(x, y).
		QueryInterface(IAccessNode).
		DOMNode;
}
*/

function convertFromUnplaceableHTML(str){
	var arr = [];
	for(var i=0,len=str.length ; i<len ;i++)
		arr.push(str.charCodeAt(i));
	return convertFromByteArray(arr, str.match('charset=([^"; ]+)'));
}

function convertFromByteArray(arr, charset){
	return new UnicodeConverter(charset).convertFromByteArray(text);
}

/**
 * URI�𐶐�����B
 *
 * @param {String || nsIFile || nsIURI} path URL�܂��̓t�@�C���BnsIURI�̏ꍇ�A���̂܂ܕԂ��B
 */
function createURI(path){
	if(path instanceof IURI)
		return path;
	
	try{
		var path = (path instanceof IFile) ? path : new LocalFile(path);
		return IOService.newFileURI(path)	;
	}catch(e if e.name=='NS_ERROR_FILE_UNRECOGNIZED_PATH'){	}
	return IOService.newURI(path, null, null);
}

/**
 * �t�@�C�����擾����B
 *
 * @param {String || nsIFile || nsIURI} uri 
 *        URI�Bfile:�܂���chrome:����n�܂�A�h���X���w�肷��B
 *        nsIFile�̏ꍇ�A���̂܂ܕԂ��B
 */
function getLocalFile(uri){
	if(uri instanceof ILocalFile)
		return uri;
	
	uri = createURI(uri);
	if(uri.scheme=='chrome')
		uri = ChromeRegistry.convertChromeURL(uri);
	
	if(uri.scheme!='file')
		return;
	
	return IOService.getProtocolHandler('file').
		QueryInterface(Ci.nsIFileProtocolHandler).
		getFileFromURLSpec(uri.spec).
		QueryInterface(ILocalFile);
}

/**
 * �g���̃C���X�g�[������Ă���f�B���N�g�����擾����B
 *
 * @param {String} id �g��ID�B 
 */
function getExtensionDir(id){
	return ExtensionManager.
		getInstallLocation(id).
		getItemLocation(id).QueryInterface(ILocalFile);
}

function getPrefType(key){
	with(PrefBranch()){
		switch(getPrefType(key)){
			case PREF_STRING:
				return 'string';
			case PREF_BOOL:
				return 'boolean';
			case PREF_INT:
				return 'number';
			case PREF_INVALID:
				return 'undefined';
		}
	}
}

function setPrefValue(){
	var value = Array.pop(arguments);
	var key = Array.join(arguments, '');
	
	var prefType = getPrefType(key);
	with(PrefBranch()){
		switch(prefType!='undefined'? prefType : typeof(value)){
			case 'string':
				return setCharPref(key, unescape(encodeURIComponent(value)));
			case 'boolean':
				return setBoolPref(key, value);
			case 'number':
				return setIntPref(key, value);
		}
	}
}

function getPrefValue(){
	var key = Array.join(arguments, '');
	
	with(PrefBranch()){
		switch(getPrefType(key)){
			case PREF_STRING:
				return decodeURIComponent(escape(getCharPref(key)));
			case PREF_BOOL:
				return getBoolPref(key);
			case PREF_INT:
				return getIntPref(key);
		}
	}
}

/**
 * ���[�U���ʏ험�p���Ă���_�E�����[�h�f�B���N�g�����擾����B
 * Firefox�I�v�V�����Ŏw�肵���f�B���N�g���A�܂��́A�Ō�Ƀ_�E�����[�h�����f�B���N�g���ɂȂ�B
 */
function getDownloadDir(){
	try {
		var dir = new LocalFile(getPrefValue('browser.download.dir') || getPrefValue('browser.download.lastDir'));
		if(dir.exists())
			return dir
	} catch(e) {}
	
	return DownloadManager.userDownloadsDirectory;
}

/**
 * ���ݗ��p���Ă���v���t�@�C���f�B���N�g�����擾����B
 */
function getProfileDir(){
	return DirectoryService.get('ProfD', IFile);
}

/**
 * �e���|�����f�B���N�g�����擾����B
 */
function getTempDir(){
	return DirectoryService.get('TmpD', IFile);
}

/**
 * �O���G�f�B�^�Ńt�@�C�����J���B
 * Greasemonkey�Őݒ肳��Ă���G�f�B�^�A�܂��́A�u���E�U�Ń\�[�X���J�����Ɏg����G�f�B�^���Ăяo�����B
 *
 * @param {nsIFile} file �Ώۃt�@�C���B 
 */
function openInEditor(file){
	function getFile(path){
		return path && LocalFile(path);
	}
	
	var editor = 
		getFile(getPrefValue('greasemonkey.editor')) || 
		getFile(getPrefValue('view_source.editor.path'));
	if(!editor || !editor.exists())
		return;
	
	var mimeInfo = MIMEService.getFromTypeAndExtension(
		MIMEService.getTypeFromFile(file), 
		file.leafName.split('.').pop());
	mimeInfo.preferredAction = mimeInfo.useHelperApp;
	mimeInfo.preferredApplicationHandler = editor;
	mimeInfo.launchWithFile(file);
}

function getMostRecentWindow(){
	return WindowMediator.getMostRecentWindow('navigator:browser');
}

function findCacheFile(url){
	var entry;
	CacheService.visitEntries({
		visitDevice : function(deviceID, deviceInfo){
			if(deviceID == 'disk')
				return true;
		},
		visitEntry : function(deviceID, info){
			if(info.key != url)
				return true;
			
			entry = {
				clientID    : info.clientID, 
				key         : info.key, 
				streamBased : info.isStreamBased(),
			};
		},
	});
	
	if(!entry)
		return;
	
	try{
		var session = CacheService.createSession(
			entry.clientID, 
			ICache.STORE_ANYWHERE, 
			entry.streamBased);
		session.doomEntriesIfExpired = false;
		var descriptor = session.openCacheEntry(
			entry.key, 
			ICache.ACCESS_READ, 
			false);
		
		return descriptor.file;
	} finally{
		// [FIXME] copy to temp
		// descriptor && descriptor.doom();
		descriptor && descriptor.close();
	}
}

/**
 * �X�g���[������������B
 * ���s��ɕK���X�g���[����������B
 *
 * @param {Object} stream �X�g���[���B 
 * @param {Function} func �X�g���[���𗘗p���鏈���B�X�g���[�����n�����B 
 */
function withStream(stream, func){
	try{
		return func(stream);
	} finally{
		stream && stream.close && stream.close();
	}
}

/**
 * HTML�����񂩂�object/script/body/style�Ȃǂ̗v�f����菜���B
 * �܂��s���S�ȃ^�O�Ȃǂ𐮌`��������HTML�֕ϊ�����B
 * Firefox 3�ł́AJavaScript�v���g�R���̏������s���Ȃ��B
 *
 * @param {String} html HTML�B 
 * @return {String} ���`���ꂽHTML�B
 */
function sanitizeHTML(html){
	var doc = document.implementation.createDocument('', '', null);
	var root = doc.appendChild(doc.createElement('root'));
	
	var fragment = UnescapeHTML.parseFragment(html, false, null, doc.documentElement);
	doc.documentElement.appendChild(fragment);
	
	if(!root.childNodes.length)
		return '';
	return serializeToString(root).match(/^<root>(.*)<\/root>$/)[1];
}

function serializeToString(xml){
	return (new XMLSerializer()).serializeToString(xml);
}
