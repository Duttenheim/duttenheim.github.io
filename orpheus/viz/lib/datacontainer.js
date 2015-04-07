//----------------------------------------
/**
	Data container which uses the google visualization data table structure.
	Can be re-wrapped to use another API if needs be.
*/
function DataContainer()
{
	// create data table
	this.data = null;
}

//----------------------------------------
/**
*/
DataContainer.prototype.NewTable = function()
{
	this.data = new google.visualization.DataTable();
}

//----------------------------------------
/**
	Add column to data container. The allowed types are:
		number
		string
*/
DataContainer.prototype.AddColumn = function(type, name)
{
	this.data.addColumn(type, name);
}

//----------------------------------------
/**
	Add row. Values here must have a value for each column, or otherwise following fields will be left empty
*/
DataContainer.prototype.AddRow = function(values)
{
	this.data.addRow(values)
}
