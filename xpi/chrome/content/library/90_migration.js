// 2008/8/17 0.3.11�ڍs
(function(){
	var json = getPref('postConfig');
	if(!/reblog:/.test(json))
		return;
	
	var configs = eval(json);
	items(configs).forEach(function([name, config]){
		if(!models[name])
			return;
		
		var favor = models[name].favor;
		
		delete config.reblog;
		
		items(config).forEach(function([type, value]){
			// �ЂƂł�default�Ɏw�肳��Ă�����favorite��default�Ƃ���
			if(favor && value)
				config.favorite = 'default';
			
			config[type] = value? 'default' :
				(value === '')? 'disabled' : 'enabled';
		});
		
		// favorite�����ݒ�Ȃ�enabled�Ƃ���
		if(favor && !config.favorite)
			config.favorite = 'enabled';
	});
	
	// 0.3.11�ł�favorite�̈Ӗ������Ȃ��������߂��̂܂܈ڍs���Ȃ�
	if(configs.Flickr.photo == 'default')
		configs.Flickr.photo = 'enabled';
	
	setPref('postConfig', uneval(configs));
})()
