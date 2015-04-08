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
	Constructor for main tool, the visualizer.
	@param criteriaContainerDiv is an HTML div to which all the criteria buttons will be inserted.
	@param graphDiv is an HTML div into which the graph will be rendered.
	@param switchesDiv is an HTML div into which all the data switches will be inserted.
*/
function Visualizer(criteriaContainerDiv, graphDiv, switchesDiv)
{
	this.criteriaContainer = document.getElementById(criteriaContainerDiv);
	this.graphContainer = document.getElementById(graphDiv);
	this.switchesContainer = document.getElementById(switchesDiv);
	
	if (this.criteriaContainer == null)
	{
		throw "Input div sent to Visualizer constructor is invalid";
	}
	if (this.graphContainer == null)
	{
		throw "Chart div needs to be defined";
	}
	if (this.switchesContainer == null)
	{
		throw "Switches div needs to be defined";
	}
	
	this.criteria = [];
	this.criteriaChains = [];
	this.criterionSlots = [];
	this.series = []; 
	this.chartMode = SupportedCharts.AREA;
}

//----------------------------------------
/**
	Set the used graph type.
	@param mode is the type of graph, can be SupportedCharts.Line, SupportedCharts.Area or SupportedCharts.Pie.
*/
Visualizer.prototype.SetGraphMode = function(mode)
{
	this.chartMode = mode;
	this.Draw();
}

//----------------------------------------
/**
	Starts the criteria adding process, this will create a new criteria separator and title.
	@param name is the name of this criteria section.
*/
Visualizer.prototype.BeginCriteria = function(name)
{
	var div = document.createElement("div");
	div.id = name;
	//div.style.margin = 10;
	div.innerHTML = name;
	//var br = document.createElement("br");
	//div.appendChild(br);
	this.criteriaContainer.appendChild(div);
	
	this.criteriaSection = div;
	this.criteriaSection.criteria = [];
	this.criteriaSection.buttons = [];
	this.currentCriteria = name;
	this.criterionSlots.push(null);
}

//----------------------------------------
/**
	Add a new selectable criterion to the visualizer.
	@param criterion is the name of the criterion
*/
Visualizer.prototype.AddCriterion = function(criterion)
{
	if (this.currentCriteria == null || this.criteriaSection == null)
	{
		throw "Not inside Begin/End criteria; cannot add new criteria.";
	}
	
	var button = document.createElement("button");
	button.setAttribute("style", "width: 95%");
	button.setAttribute("class", "button-enabled");
	button.setAttribute("id", criterion.name);
	button.innerHTML = criterion.name;
	var slot = this.criterionSlots.length - 1;
	var section = this.criteriaSection;
	this.criteriaSection.criteria.push(criterion);
	this.criteriaSection.buttons.push(button);
	button.onclick = function() { this.OnCriterionSelected(criterion, slot, button, section); }.bind(this);
	this.criteriaSection.appendChild(button);
	
	this.criteria[this.criteria.length] = criterion;
	
	//var num = 0;
	//window.setInterval(function() {button.setAttribute("style", "width: " + num + "%"); num += 1; }, 100);
}

//----------------------------------------
/**
	End the criteria creation process, which will add a spacer beneath the finished selectable criteria.
*/
Visualizer.prototype.EndCriteria = function()
{
	if (this.criteriaSection == null)
	{
		throw "Not in BeginCriteria; cannot end criteria section."
	}
	var spacer = document.createElement("hr");
	this.criteriaSection.appendChild(spacer);
}

//----------------------------------------
/**
	Add a chain of criterion we can select to get the series.
	@param chain is a linked list of the criterion, with a data series at the end
*/
Visualizer.prototype.AddCriterionChain = function(chain)
{
	this.criteriaChains.push(chain);
}	

//----------------------------------------
/**
	Handle a data criteria being clicked. Private function created when a button is created, do not call this yourself.
	@param criterion is the criterion being selected or deselected
	@param criterionSlot is the slot (criterion section) in which this criterion lies within the visualizer.
	@param button is a reference to the button used when clicking the criterion.
*/
Visualizer.prototype.OnCriterionSelected = function(criterion, criterionSlot, button, section)
{
	// disable all buttons first
	for (i = 0; i < section.criteria.length; i++)
	{
		section.criteria[i].enabled = false;
		section.buttons[i].setAttribute("class", "button-enabled");
	}
	
	// select the slot of the criterion we are using 
	if (criterion.enabled && this.criterionSlots[criterionSlot] == criterion)
	{
		this.criterionSlots[criterionSlot] = null;
	}
	else
	{
		this.criterionSlots[criterionSlot] = criterion;
	}
	
	// then set the criterion to be enabled
	criterion.enabled = true;
	button.setAttribute("class", "button-toggled");
	this.Draw();
}


//----------------------------------------
/**
	Add a selection switch
	@param name is the name of the switch
*/
Visualizer.prototype.AddDataSwitch = function(dataSwitch)
{
	var button = document.createElement("button");
	button.setAttribute("class", "button-enabled");
	//button.setAttribute("style", "margin-left: 5px; margin-right: 5px; margin-top: 5px; margin-bottom: 5px");
	button.setAttribute("id", dataSwitch.name);
	button.innerHTML = dataSwitch.name;
	button.onclick = function() { this.OnSwitchSelected(dataSwitch, button); }.bind(this);
	this.switchesContainer.appendChild(button);
}

//----------------------------------------
/**
	Handle a switch getting selected. Private function called from within the visualizer whenever a data switch is selected
	@param dataSwitch is the data switch which we selected.
	@param button is the button used to select said switch.
*/
Visualizer.prototype.OnSwitchSelected = function(dataSwitch, button)
{
	dataSwitch.Flip();
	if (dataSwitch.enabled)	button.setAttribute("class", "button-toggled");
	else 					button.setAttribute("class", "button-enabled");
	this.Draw();
}

//----------------------------------------
/**
	Main preparation function. This function needs to be run before anything is done with the visualizer.
	@param title will be the title of the rendered graph.
	@param subtitle will be the describing title, if the graph supports this, which will be displayed.
	@param width is the width of the rendered graph.
	@param height is the height of the rendered graph.
*/
Visualizer.prototype.Setup = function(title, subtitle, width, height)
{
	this.title = title;
	this.subtitle = subtitle;
	this.width = width;
	this.height = height;
}

//----------------------------------------
/**
	Setup the first column in the table of data, which describes our data axis and its title.
	@param type is the type of data in the first column.
	@param name is the name of the indexing column.
*/
Visualizer.prototype.SetupIndexColumn = function(type, name)
{
	this.horizontalType = type;
	this.horizontalTitle = name;
}

//----------------------------------------
/**
	Set name of the vertical header.
	@param name is the name of the vertical header.
*/
Visualizer.prototype.SetupVerticalHeader = function(name)
{
	this.verticalTitle = name;
}

//----------------------------------------
/**
	Draws the graph.
*/
Visualizer.prototype.Draw = function()
{
	// first we must determine if we have a data valid data series using our selection
	var chain = null;
	var hasSeries = false;
	for (i = 0; i < this.criteriaChains.length; i++)
	{
		chain = this.criteriaChains[i];
		for (j = 0; j < this.criterionSlots.length; j++)
		{
			if (this.criterionSlots[j] != null && this.criterionSlots[j].Matches(chain))
			{
				if (chain.series.length == 0)
				{
					chain = chain.next;	
				}				
			}
			else
			{
				// we failed with this chain, so lets move on to the next
				chain = null;
				break;
			}
		}
		
		// if this is valid, we should have a series and thusly, we are done!
		if (chain != null && chain.series.length != 0)
		{
			hasSeries = true;
			break;
		}
	}

	// always clear
	this.graphContainer.innerHTML = "";
	if (hasSeries)
	{
		// create chart options and make it fit our theme
		var options = {
					   title:this.title,
					   subtitle:this.subtitle,
					   width:this.width,
					   height:this.height,
					   //backgroundColor:'#333333',
					   backgroundColor: {fill: '#333333'},
					   chartArea: { backgroundColor:'#333333' },
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
						   0: {title: this.horizontalTitle, titleTextStyle: {'color':'#FFFFFF'}}
					   }
					   };
			
		
		// start off by creating a new data table, and add to it the horizontal settings
		var data = new google.visualization.DataTable();
		data.addColumn(this.horizontalType, this.horizontalTitle);
		var activeSeries = [];
		var longestRow = 0;
		
		// go through our criteria and calculate the longest series of values which we will then use when writing the graphs
		for (i = 0; i < chain.series.length; i++)
		{
			var serie = chain.series[i];
			if (serie.dataSwitch.enabled)
			{
				activeSeries.push(serie);
				data.addColumn(serie.type, serie.name);
				longestRow = Math.max(longestRow, serie.data.length);	
			}			
		}
		
		// go through the longest row (which will also be inclusive of all values of all series (criteria)
		for (i = 0; i < longestRow; i++)
		{
			// create a new array with criteria size + 1 for the header column (the new Array is ill advised, but it's exactly what we want here)
			var row = new Array(activeSeries.length + 1);
			for (j = 0; j < activeSeries.length; j++)
			{
				var serie = activeSeries[j];
				
				// only put value if this series has a value on this point
				if (i < serie.data.length) { row[0] = serie.data[i][0]; row[j+1] = serie.data[i][1]; }
			}
			data.addRow(row);
		}
		
		if (activeSeries.length > 0)
		{
			// clear container and draw chart
			var chart;
			switch (this.chartMode)
			{
				case SupportedCharts.LINE:
					chart = new google.visualization.LineChart(this.graphContainer);
					break;
				case SupportedCharts.AREA:
					chart = new google.visualization.AreaChart(this.graphContainer);
					break;
				case SupportedCharts.PIE:
					chart = new google.visualization.PieChart(this.graphContainer);
					break;
				case SupportedCharts.BAR:
					chart = new google.visualization.BarChart(this.graphContainer);
					break;
			}
			
			chart.draw(data, options);	
		}
	}	
}

//----------------------------------------
/**
*/
Visualizer.prototype.Debug = function()
{
	var output = "";
	for (index = 0; index < this.criteria.length; index++)
	{
		output += this.criteria[index].name + "\n";
	}
	alert(output);
}
