let inspector = function (){
	let inspectorObjects;
	let funcs;
	let lines;
	let blocks;
	let currentFunc;
	let currentScript;
	let linesCount;
	
	let _init = function() {
		funcs = [];
		blocks = [];
		lines = [];
		linesCount = [];
		blocksCount = [];
		funcsCount = [];
		currentFunc = -1;
	}
	
	let _initFromUrl = function(callback) {
		var url = new URL(window.location.href);
		$.getJSON(url.searchParams.get("file"), function(data){
			inspectorObjects = data;
			callback();
		});
	}
	
	let _buildInspector = function() {
		return _parseFunc(0, inspectorObjects)
	}
	
	let _parseScript = function(func) {
		if(func == currentFunc)
			return currentScript;
		
		console.log("[Writing] " + func.ScriptFunction.Name)
		currentScript = $("<code>").addClass("lang-lua");
		$.each(func.ScriptFunction.Blocks, function(i, block) {
			var blockText = $("<span>");
			$.each(block.Lines, function(i, line) {
				blockText.append($("<span>").addClass("sline-default").text(line.Text));
			})
			
			var addNoteClass = "";
			
			// rules based on https://ferib.dev/blog.php?l=post/Lua_Devirtualization_Part_2_Decompiling_Lua#BlockDefinitions
			if(block.JumpsTo != -1 && block.JumpsNext != -1) // TODO: check opcode?
				addNoteClass = "sblock-if";
			else if (block.JumpsTo != -1 && block.JumpsNext == -1)
				addNoteClass = "sblock-else";
			else if (block.JumpsTo == -1 && block.JumpsNext != -1)
				addNoteClass = "sblock-endif";
			else if (block.JumpsTo == -1 && block.JumpsNext == -1)
				addNoteClass = "sblock-end";
			
			blockText.addClass(addNoteClass);
			currentScript.append(blockText) // questionable
		})
		return currentScript;
	}
	
	let _getLines = function() {
		lines = $("<ul>");
		// TODO
	}
	
	let _highlightLine = function(funcIndex, lineIndex) {
		var offset = 0;
		for(var i = 0; i < funcIndex; i++)
		{
			offset += linesCount[i];
		}
		return lineIndex - offset;
	}
	
	let _highlightBlock = function(funcIndex, blockIndex) {
		var offset = 0;
		for(var i = 0; i < funcIndex; i++)
		{
			offset += blocksCount[i]
		}	
		return blockIndex - offset;
	}
	
	// TODO: this is ugly, cleanup?
	let _parseFunc = function(index, func) {
		index++;
		var lcount = 0;
		var bcount = 0;
		funcsCount++;
		console.log("[Parsing][" + func.ScriptFunction.Name + "] Blocks count: " + func.ScriptFunction.Blocks.length);
		funcs.push(func) // save reference for later
		
		var newInspector = $("<ul>").addClass("inspector");
		var upvaluesInspector = $("<ul>").addClass("inspector").addClass("hide")
		var constantsInspector = $("<ul>").addClass("inspector").addClass("hide")
		var blockInspector = $("<ul>").addClass("inspector").addClass("hide")
		var childFuncInspector = $("<ul>").addClass("inspector").addClass("hide")
		
		// append properties main Inspector
		newInspector.append(
			$("<li>").addClass("ins-item").css("background-color" , "#80c0ff1f").text("Name").append($("<span>").append($("<a>").addClass("lasm-func").attr("href", "#").text((func.ScriptFunction.IsLocal ? "local " : "") + func.ScriptFunction.Name + "()"))), // TODO: add args
			$("<li>").addClass("ins-item").text("UpvaluesCount").append($("<span>").text(func.UpvaluesCount)),
			$("<li>").addClass("ins-list").append($("<a>").attr("href", "#").text("[Upvalues] (" + func.Upvalues.length + ")")).append($("<span>").append(upvaluesInspector)),
			$("<li>").addClass("ins-list").append($("<a>").attr("href", "#").text("[Constants] (" + func.Constants.length + ")")).append($("<span>").append(constantsInspector)),
			$("<li>").addClass("ins-list").append($("<a>").attr("href", "#").text("[Blocks] (" + func.ScriptFunction.Blocks.length + ")")).append($("<span>").append(blockInspector)),
			$("<li>").addClass("ins-list").append($("<a>").attr("href", "#").text("[Functions] (" + func.Functions.length + ")")).append($("<span>").append(childFuncInspector))
		).addClass("insp-func");
		
		// build Blocks (array)		
		$.each(func.ScriptFunction.Blocks, function(i, block) {
			var newBlock = $("<ul>").addClass("inspector").addClass("hide");
			newBlock.append($("<li>").addClass("ins-item").text("ifChainIndex").append($("<span>").text(block.ifChainIndex)));
			newBlock.append($("<li>").addClass("ins-item").text("JumpsNext").append($("<span>").text(block.JumpsTo)));
			newBlock.append($("<li>").addClass("ins-item").text("JumpsTo").append($("<span>").text(block.JumpsNext)));
			
			// append Line to Lines
			// append Instruction to Instructions
			var blockLines = $("<ul>").addClass("inspector").addClass("hide");
			var blockInstructions = $("<ul>").addClass("inspector").addClass("hide");
			$.each(block.Lines, function(i, b) {
				blockLines.append(
					$("<li>").addClass("ins-item").addClass("insp-line").append(
						$("<code>").text("[" + (block.StartAddress + i) + "]: " + b.Text)
					)
				)
				var instr = block.Lines[i].Instr;
				blockInstructions.append(
					$("<li>").addClass("ins-item").addClass("insp-opcode").append(
						$("<code>").text("[" + (block.StartAddress + i) + "] " + instr.Text) // TODO fix this
					)
				)
				
				lcount++;
				lines.push(b);
			})
			
			// append Lines to Block
			newBlock.append(
				$("<li>").addClass("ins-list").append(
					$("<a>").attr("href", "#").text("[Lines] (" + block.Lines.length + ")")
				).append(
					$("<span>").append(blockLines)
				)
			)
			
			// append Instructions to Block
			newBlock.append(
				$("<li>").addClass("ins-list").append(
					$("<a>").attr("href", "#").text("[Instructions] (" + block.Lines.length + ")")
				).append(
					$("<span>").append(blockInstructions)
				)
			)
			
			var addNoteClass = "";
			
			// rules based on https://ferib.dev/blog.php?l=post/Lua_Devirtualization_Part_2_Decompiling_Lua#BlockDefinitions
			if(block.JumpsTo != -1 && block.JumpsNext != -1) // TODO: check opcode?
				addNoteClass = "block-if";
			else if (block.JumpsTo != -1 && block.JumpsNext == -1)
				addNoteClass = "block-else";
			else if (block.JumpsTo == -1 && block.JumpsNext != -1)
				addNoteClass = "block-endif";
			else if (block.JumpsTo == -1 && block.JumpsNext == -1)
				addNoteClass = "block-end";
				
			// append Block to Function
			blockInspector.append(
				$("<li>").addClass("ins-list").append($("<a>").addClass("insp-block").attr("href", "#").text("[" + i + "]").append($("<span>").addClass("lasm-note").text(" - " + block.StartAddress + ": JMP: " + block.JumpsTo + ", ELSE: " + block.JumpsNext))).addClass(addNoteClass).append(
					$("<span>").append(newBlock)
				)
			)
			
			bcount++;
			blocks.push(block);
		});
		
		// build Upvalues
		$.each(func.Upvalues, function(i, item) {
			upvaluesInspector.append(
				$("<li>").addClass("ins-item").text("[" + i + "]").append($("<span>").text("\"" + item.Value + "\""))
			)
		})


		// build Constants
		$.each(func.Constants, function(i, item) {
			constantsInspector.append(
				$("<li>").addClass("ins-item").text("[" + i + "]").append($("<span>").text("\"" + item.Value + "\""))
			)
		})

		linesCount.push(lcount);
		blocksCount.push(bcount);

		// append Functions to Function
		$.each(func.Functions, function(i, item) {
			childFuncInspector.append(_parseFunc(i, item))
		});

		return newInspector;
	}
	
	let _writeFunc = function(index) {
		return _parseScript(funcs[index])
	}
	
	return {
		init: _init,
		parseScript: _parseScript,
		parseFunc: _parseFunc,
		buildInspector: _buildInspector,
		writeFunc: _writeFunc,
		initFromUrl: _initFromUrl,
		getLines: _getLines,
		highlightLine: _highlightLine,
		highlightBlock: _highlightBlock
	}
}();

inspector.init();