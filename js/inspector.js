let inspector = function (){
	let inspectorObjects;
	let funcs;
	
	let _initt = function(jsonString) {
		funcs = [];
		inspectorObjects = jsonString; // deserialise?
	}
	
	let _buildInspector = function() {
		return _parseFunc(0, inspectorObjects)
	}
	
	let _parseScript = function(func) {
		console.log("[Writing] " + func.ScriptFunction.Name)
		$.each(func.ScriptFunction.Blocks, function(i, block) {
			var blockText = "";
			$.each(block.Lines, function(i, line) {
				blockText += line.Text;
			})
			$("pre.lasm-script").append(
				$("<span>").addClass("sblock-if").text(blockText) // questionable
			)
		})
	}
	
	// TODO: this is ugly, cleanup?
	let _parseFunc = function(index, func) {
		index++;
		console.log("[Parsing][" + func.ScriptFunction.Name + "] Blocks count: " + func.ScriptFunction.Blocks.length);
		var we = inspectorObjects
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
		);
		
		// build Blocks (array)		
		$.each(func.ScriptFunction.Blocks, function(i, item) {
			var newBlock = $("<ul>").addClass("inspector").addClass("hide");
			newBlock.append($("<li>").addClass("ins-item").text("ifChainIndex").append($("<span>").text(item.ifChainIndex)));
			newBlock.append($("<li>").addClass("ins-item").text("JumpsNext").append($("<span>").text(item.JumpsTo)));
			newBlock.append($("<li>").addClass("ins-item").text("JumpsTo").append($("<span>").text(item.JumpsNext)));
			
			// append Line to Lines
			// append Instruction to Instructions
			var blockLines = $("<ul>").addClass("inspector").addClass("hide");
			var blockInstructions = $("<ul>").addClass("inspector").addClass("hide");
			$.each(item.Lines, function(i, b) {
				blockLines.append(
					$("<li>").addClass("ins-item").append(
						$("<code>").text("[" + i + "]: " + b.Text).addClass("insp-code")
					)
				)
				var instr = item.Lines[i].Instr;
				blockInstructions.append(
					$("<li>").addClass("ins-item").append(
						$("<span>").text("[" + i + "]")
					).text(instr.Text) // TODO fix this
				);
			})
			
			// append Lines to Block
			newBlock.append(
				$("<li>").addClass("ins-list").append(
					$("<a>").attr("href", "#").text("[Lines] (" + item.Lines.length + ")")
				).append(
					$("<span>").append(blockLines)
				)
			)
			
			// append Instructions to Block
			newBlock.append(
				$("<li>").addClass("ins-list").append(
					$("<a>").attr("href", "#").text("[Instructions] (" + item.Lines.length + ")")
				).append(
					$("<span>").append(blockInstructions)
				)
			)
			
			var addNoteClass = "";
			
			// rules based on https://ferib.dev/blog.php?l=post/Lua_Devirtualization_Part_2_Decompiling_Lua#BlockDefinitions
			if(item.JumpsTo != -1 && item.JumpsNext != -1) // TODO: check opcode?
				addNoteClass = "block-if";
			else if (item.JumpsTo != -1 && item.JumpsNext == -1)
				addNoteClass = "block-else";
			else if (item.JumpsTo == -1 && item.JumpsNext != -1)
				addNoteClass = "block-endif";
			else if (item.JumpsTo == -1 && item.JumpsNext == -1)
				addNoteClass = "block-end";
				
			// append Block to Function
			blockInspector.append(
				$("<li>").addClass("ins-list").append($("<a>").attr("href", "#").text("[" + i + "]").append($("<span>").addClass("lasm-note").text(" - " + item.StartAddress + ": JMP: " + item.JumpsTo + ", ELSE: " + item.JumpsNext))).addClass(addNoteClass).append(
					$("<span>").append(newBlock)
				)
			)
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

		// append Functions to Function
		$.each(func.Functions, function(i, item) {
			childFuncInspector.append(_parseFunc(i, item))
		});

		return newInspector;
	}
	
	let _writeFunc = function(index) {
		_parseScript(funcs[index])
	}
	
	return {
		initt: _initt,
		parseScript: _parseScript,
		parseFunc: _parseFunc,
		buildInspector: _buildInspector,
		writeFunc: _writeFunc
	}
}();
inspector.init();
