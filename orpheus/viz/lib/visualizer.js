//----------------------------------------
/**
*/
var SupportedCharts = 
{
	LINE: 0,
	AREA: 1,
	PIE: 2,
	BAR: 3
}

//----------------------------------------
/**
*/
function Visualizer()
{
	this.rows = 0;
	this.columns = 0;
	this.supportedGraphs = [];
	this.data = null;
}

//----------------------------------------
/**
	@param data is a CSV string
*/
Visualizer.prototype.Load = function(data)
{
	this.data = $.csv.toArrays(data);
}

//----------------------------------------
/**
	@param type is an integer denoting the type of graph we should generate
*/
Visualizer.prototype.CreateGraph = function(type)
{
	var element = document.createElement("div");
	
	// create chart options and make it fit our theme
	var options =
	{
	   title:this.title,
	   subtitle:this.subtitle,
	   width:this.width,
	   height:this.height,
	   //backgroundColor:'#333333',
	   backgroundColor: {fill: 'transparent'},
	   chartArea: { backgroundColor:'transparent' },
	   legendTextStyle:{'color':'#FFFFFF'},					   
	   titleTextStyle:{'color':'#FFFFFF'},					   
	   is3D: true,
	   pointSize: 5,
	   series: { 
		0: {targetAxisIndex: 0}
	   },
	   vAxes: {
		   0: {title: this.verticalTitle, titleTextStyle: {'color':'#FFFFFF'}}
	   },
	   hAxes: {
		   0: {title: "Time (minutes)", titleTextStyle: {'color':'#FFFFFF'}}
	   }
    };
	
	var table = new google.visualization.DataTable();
	var numColumns = this.data[0].length;
	for (i = 0; i < numColumns; i++)
	{
		table.addColumn('number', 'Value');
	}
	for (i = 0; i < this.data.length; i++)
	{
		var row = new Array(numColumns);
		for (j = 0; j < numColumns; j++)
		{
			row[j] = parseInt(this.data[i][j]);
		}
		table.addRow(row);
	}
	
	var chart;
	switch (type)
	{
		case SupportedCharts.LINE:
			chart = new google.visualization.LineChart(element);
			break;
		case SupportedCharts.AREA:
			chart = new google.visualization.AreaChart(element);
			break;
		case SupportedCharts.PIE:
			chart = new google.visualization.PieChart(element);
			break;
		case SupportedCharts.BAR:
			chart = new google.visualization.BarChart(element);
			break;
	}
	chart.draw(table, options);
	return element;
}
