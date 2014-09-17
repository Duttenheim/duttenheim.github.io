//----------------------------------------------------------------------------
/**
	This is the JS parser.
	The parser is very minimalistic, it keeps the function scopes 'intact' and uses the built-in javascript evaluator to check for the syntax.
	It however parses the function and variable definitions in order to ensure that the JS fits with the rest of the SATIN component.
	
	The parser can be extended by some willing soul in order to get a REAL open source JavaScript parser. It could be useful for many purposes.
*/
function JSParser()
{
	this.currentRow = -1;
	this.text = [];
	this.currentSymbol = null;
	this.error = null;
	this.errorRow = -1;
}

//----------------------------------------------------------------------------
/**
*/
var JSSymbols
{
	Unknown		: -1,
	Variable	: 0,
	Function	: 1,
	Scope		: 2
}

//----------------------------------------------------------------------------
/**
	JSSymbol is a javascript symbol. A symbol is a 'base class' for all defined objects.
	Basically used for Scopes, Functions and Variables.
*/
function JSSymbol()
{
	this.type = JSSymbols.Unknown;	
	this.name = "";
	this.parent = null;
}

//----------------------------------------------------------------------------
/**
*/
JSParser.prototype.Parse = function(text)
{
	if (text.length == 0)
	{
		this.error = "Empty string contains no Javascript!";
		return false;
	}
	this.text = text.split("\n");
	this.currentRow = 0;
	
	// create and set the first symbol as the global scope
	// any variable created when this symbol is the current symbol will be treated as a global symbol
	this.currentSymbol = new JSSymbol;
	this.currentSymbol.type = JSSymbols.Scope;
	this.currentSymbol.name = "main";
	
	// parse row by row
	for (var i = 0; i < this.text.length; i++)
	{
		this.ParseRow();
		if (this.error != null)
		{
			this.errorRow = this.currentRow;
			return false;
		}		
		this.currentRow++;
	}
}

//----------------------------------------------------------------------------
/**
*/
JSParser.prototype.ParseRow = function()
{
	var row = this.text[this.currentRow];
	row = row.trim();
	
	while (row.length > 0)
	{
		var statements = row.split(";");
		for (var i = 0; i < statements.length; i++)
		{
			// parse statements
			this.ParseStatement(statements[i]);
		}
	}
}

//----------------------------------------------------------------------------
/**
*/
JSParser.prototype.ParseStatement = function(statement)
{
	
}

//----------------------------------------------------------------------------
/**
	This section defines all statements which should be parsable
*/
//----------------------------------------------------------------------------

//----------------------------------------------------------------------------
/**
*/
function ParseVar(statement)
{

}

//----------------------------------------------------------------------------
/**
*/
function ParseFunction(statement)
{

}

//----------------------------------------------------------------------------
/**
*/
function ParseScope(statement)
{

}

//----------------------------------------------------------------------------
/**
*/
function ParseIf(statement)
{

}

//----------------------------------------------------------------------------
/**
*/
function ParseAssignment(statement)
{

}

//----------------------------------------------------------------------------
/**
*/
function ParseCall(statement)
{

}

//----------------------------------------------------------------------------
/**
*/
function ParseFor(statement)
{

}

//----------------------------------------------------------------------------
/**
*/
function ParseWhile(statement)
{

}

function 

//----------------------------------------------------------------------------
/**
	This section defines all expressions
*/
//----------------------------------------------------------------------------


//----------------------------------------------------------------------------
/**
*/
function ParseAddition(exp)
{

}

//----------------------------------------------------------------------------
/**
*/
function ParseSubtraction(exp)
{

}

//----------------------------------------------------------------------------
/**
*/
function ParseMultiply(exp)
{

}

//----------------------------------------------------------------------------
/**
*/
function ParseDivide(exp)
{

}

//----------------------------------------------------------------------------
/**
*/
function ParseParanthesis(exp)
{

}

