var cp = require('child_process');
var http = require('http');
var qs = require('querystring');
var request = require('request');


//
// config
//

var cfg = require('./config.json');


//
// the game
//

var proc = cp.spawn(cfg.frotz_path, ['-p', cfg.zfile_path]);

proc.on('close', function(code, signal){
	console.log('proc closed');
});
proc.on('error', function(){
	console.log('proc error');
});
proc.on('exit', function(){
	console.log('proc exit');
});
proc.on('disconnect', function(){
	console.log('proc disconnect');
});
proc.on('message', function(){
	console.log('proc message');
});

function process_line(lines){
	console.log('BUFFER ' + lines);

	var options = {
		"channel": cfg.channel,
		"text": lines,
		"username": cfg.bot_name,
	};

	request.post({url: cfg.webhook_url, body: JSON.stringify(options)}, function(e,r,body){
	});
}

proc.stdout.on('data', function(data){
	data =""+data;
	var rx = /\x1b.*?[a-zA-Z]/g;
	data = data.replace(rx, '');

	var out = [];

	var lines = data.split(/\r\n|\n|\r/);
	for (var i=0; i<lines.length; i++){
		var l = lines[i].trim();
		if (!l.length) continue;
		if (l.substr(0,1) == '>') continue;
		out.push(l);		
	}

	process_line(out.join("\n"));
});

proc.stderr.on('data', function (data) {
	console.log('stderr: ' + data);
});


//
// the web server
//

http.createServer(function (req, res){

	var buffer = null;

	req.on('data', function(chunk){
		if (buffer){
			buffer += chunk;
		}else{
			buffer = chunk;
		}
	});

	req.on('end', function(){

		var obj = qs.parse(""+buffer);

		if (obj.user_name != 'slackbot'){

			if (obj.text){
				proc.stdin.write(obj.text+"\n");
			}
		}

		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end("ok");
	});

}).listen(cfg.server_port);
