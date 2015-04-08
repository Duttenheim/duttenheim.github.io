//----------------------------------------
/**
	Constructor for switch which controls what data is supposed to be showed.
	Data switches are used to toggle whether or not a series of data is interesting or not. 
	Attach a switch to a series, then manipulate this switch in order to toggle whether or not a series is relevant or not.
	@param name is the name of the switch
*/
function DataSwitch(name)
{
	this.name = name;
	this.enabled = false;	
}

//----------------------------------------
/**
*/
DataSwitch.prototype.Flip = function()
{
	this.enabled = !this.enabled;	
}