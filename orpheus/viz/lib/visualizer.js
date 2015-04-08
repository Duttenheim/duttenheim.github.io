//----------------------------------------
/**
	Constructor for main tool, the visualizer
*/
function Visualizer(criteriaContainerDiv, graphDiv)
{
	this.criteriaContainer = document.getElementById(criteriaContainerDiv);
	this.graphContainer = document.getElementById(graphDiv);
	
	if (this.criteriaContainer == null)
	{
		throw "Input div sent to Visualizer constructor is invalid";
	}
	if (this.graphContainer == null)
	{
		throw "Chart div needs to be defined";
	}
	
	this.criteria = [];
	this.criterionSlots = [];
	this.series = []; 
}

//----------------------------------------
/**
	Starts the criteria adding process, this will create a new criteria separator and title
*/
Visualizer.prototype.BeginCriteria = function(name)
{
	var div = document.createElement("div");
	div.id = name;
	div.style.margin = 10;
	div.innerHTML = name;
	this.criteriaContainer.appendChild(div);
	this.criteriaSection = div;
	this.currentCriteria = name;
	this.criterionSlots.push(null);
}

//----------------------------------------
/**
	Adds a new criteria to the visualiser, which will pop up in the left criteria bar.
*/
Visualizer.prototype.AddCriterion = function(criteria)
{
	if (this.currentCriteria == null || this.criteriaSection == null)
	{
		throw "Not inside Begin/End criteria; cannot add new criteria.";
	}
	
	var button = document.createElement("button");
	button.setAttribute("class", "button-enabled");
	button.setAttribute("style", "width: 100%");
	button.setAttribute("id", criteria.name);
	button.innerHTML = criteria.name;
	button.onclick = function() { this.OnCriterionSelected(criteria, this.criterionSlots.length - 1); }.bind(this);
	this.criteriaSection.appendChild(button);
	
	this.criteria[this.criteria.length] = criteria;
}

//----------------------------------------
/**
	End the criteria creation process, which will add a spacer beneath the finished criteria.
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
	Handle a data criteria being clicked
*/
Visualizer.prototype.OnCriterionSelected = function(criterion, criterionSlot)
{
	if (criterion.enabled && this.criterionSlots[criterionSlot] == criterion)
	{
		this.criterionSlots[criterionSlot] = null;
	}
	else
	{
		this.criterionSlots[criterionSlot] = criterion;
	}
	
	criterion.enabled = !criterion.enabled;
	this.Draw();
}

//----------------------------------------
/**
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
*/
Visualizer.prototype.SetupIndexColumn = function(type, name)
{
	this.horizontalType = type;
	this.horizontalTitle = name;
}

//----------------------------------------
/**
*/
Visualizer.prototype.SetupVerticalHeader = function(name)
{
	this.verticalTitle = name;
}

//----------------------------------------
/**
	Draws the graph
*/
Visualizer.prototype.Draw = function()
{
	
	// create chart options and make it fit our theme
	var options = {
				   title:this.title,
				   subtitle:this.subtitle,
				   width:this.width,
				   height:this.height,
				   backgroundColor:'#333333',
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
	var activeCriteria = [];
	var longestRow = 0;
	
	// go through our criteria and calculate the longest series of values which we will then use when writing the graphs
	for (i = 0; i < this.criteria.length; i++)
	{
		var crit = this.criteria[i];
		if (crit.enabled)
		{
			activeCriteria.push(crit);
			data.addColumn(crit.type, crit.name);
			longestRow = Math.max(longestRow, crit.data.length);
		}		
	}
	
	// go through the longest row (which will also be inclusive of all values of all series (criteria)
	for (i = 0; i < longestRow; i++)
	{
		// create a new array with criteria size + 1 for the header column (the new Array is ill advised, but it's exactly what we want here)
		var row = new Array(activeCriteria.length + 1);
		for (j = 0; j < activeCriteria.length; j++)
		{
			var crit = activeCriteria[j];
			
			// only put value if this series has a value on this point
			if (i < crit.data.length) { row[0] = crit.data[i][0]; row[j+1] = crit.data[i][1]; }
		}
		data.addRow(row);
	}
	
	// clear container and draw chart
	this.graphContainer.innerHTML = "";
	var chart = new google.visualization.LineChart(this.graphContainer);
	chart.draw(data, options);
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
