/*
	Update multi-word-input to have a value of "".
	Effectively clears the form.
*/
function clearForm() {
	
	$("#multi-word-input").val("");
}

/*
	Change the color of the page background and the word 
	display based on the inputted word.
*/
function updateDisplay(str) {
	
	//Retrieve the color of str as #rrggbb
	var convertedColorStr = hexifyColor(wordToColor(str));
	/*
	Calculate the inputted word's complimentary color and set
	it as the background of ui-container. Not currently used 
	for	aesthetic reasons.
	
	var complimentaryColor = new Color();
	complimentaryColor.R = 255 - convertedColor.R;
	complimentaryColor.G = 255 - convertedColor.G;
	complimentaryColor.B = 255 - convertedColor.B;
	var complimentaryColorStr = hexifyColor(complimentaryColor);
	$("#ui-container").css("background-color", complimentaryColorStr);
	*/
	$("#single-word-display").text(str.toUpperCase());
	$("#single-word-display").css("color", convertedColorStr);
	$("body").css("background-color", convertedColorStr);
}


/*
	Link colors to text. Each letter has a corresponding
	color value and these values are averaged over the
	length of the word. Return a color object = {R, G, B}
*/
function wordToColor(str) {

	str = str.toUpperCase();
	
	// remove anything that is not 0-9 or a-z
	str = str.replace(/[^0-9A-Z]/g, ''); 

	var red = [];
	var green = [];
	var blue = [];
	var primaryColor = new Color();
	
	//Split each character of str into its RGB components
	for (var i=0; i<str.length; i++) {
		splitRGB(str[i]);
	}
	
	//The first and last letters are given extra
		//weight in words longer than 4 characters
	for (var i=0; i<(Math.floor(str.length/5)); i++) {
		//Weight the first letter more
		splitRGB(str[0]);
		
		//Weight the last letter more
		splitRGB(str[str.length-1]);
	}
	
	/*
		Select the RGB components of a character, and push
		them into the corresponding array as an integer.
	*/
	function splitRGB(character) {
		red.push(parseInt((colorMap[character]).substring(1,3), 16));
		green.push(parseInt((colorMap[character]).substring(3,5), 16));
		blue.push(parseInt((colorMap[character]).substring(5), 16));
	}	
	
	//Calculate the RGB values of the primary color
	primaryColor.R = Math.floor(mean(red));
	primaryColor.G = Math.floor(mean(green));
	primaryColor.B = Math.floor(mean(blue));
	
	return primaryColor;
}

/*
	Accepts an array of words and procedurally generates an
	image using each word to color a pixel.
*/
function wordToImage(strArr) {
	
	strArr = strArr.split(" ");
	
	var currentColor = new Color();	
	var textColors = [];	//Save the color data of words to reduce calculations on subsequent passes
	var currentWordCounter = 0;	//Used to iterate through words within the text. Independent of the drawing loop.
	
	var pxWidth = $("input[name=px-size]:checked", "#px-size-selector").val();//4;	//Adjust the image scaling. width%pxWidth must be zero for now
	var width = 500;	//Dimensions of the drawing area. Not required to be equal to
	var height = 300;		//the canvas dimensions
	
	//Create ImageData for each canvas. RGBA values are stored within
		//ImageData.data. More info: https://developer.mozilla.org/en-US/docs/Web/API/ImageData
	var completeCanvas = $("#complete-canvas")[0];//document.getElementById('complete-canvas');
	var completeContext = completeCanvas.getContext("2d");
	var completeImgData = completeContext.createImageData(width, height);
	
	var unitCanvas = $("#unit-canvas")[0];//document.getElementById('unit-canvas');
	var unitContext = unitCanvas.getContext("2d");
	var unitImgData = unitContext.createImageData(width, height);
	
	/*
		Given a starting position within ImageData.data and the color
		to use, fills a single pixel within completeImgData
	*/
	function fillCompletePixel(start, color) {
	
		completeImgData.data[start+0]=color.R;
		completeImgData.data[start+1]=color.G;
		completeImgData.data[start+2]=color.B;
		completeImgData.data[start+3]=255;
	}
	
	/*
		Given a starting position within ImageData.data and the color
		to use, fills a single pixel within unitImgData
	*/
	function fillUnitPixel(start, color) {
	
		unitImgData.data[start+0]=color.R;
		unitImgData.data[start+1]=color.G;
		unitImgData.data[start+2]=color.B;
		unitImgData.data[start+3]=255;
	}
	
	//Iterate through each pixel within completeImgData.
		//Loop is adjusted by pxWidth to allow Image scaling
	for (var i=0;i<completeImgData.data.length;i+=(pxWidth*4)) {
		
		//When at the left edge of the image, skip down to
			//the next unfilled row
		if (i!==0 && i%(width*4) === 0){
			i += (pxWidth-1)*width*4;
		}
		
		//When all words in the text have been used, reset to the beginning
		if(currentWordCounter >= strArr.length) {
			currentWordCounter = 0;		
		}
		
		//When the color of the current word is unknown, calculate it
		if (!textColors[currentWordCounter]) {
			currentColor = wordToColor(strArr[currentWordCounter]);
			textColors.push(currentColor);
			
			//Fill in the unitCanvas on the first pass through strArr only
				//Fill based upon pxWidth scaling (pxWidth by pxWidth area)
			for (var j=0;j<4*pxWidth;j+=4) {
				for (var k=0;k<pxWidth;k++) {
					fillUnitPixel(i+j+(4*k*width), currentColor);
				}
			}
		}
		//When the color of the current word is known, use it
		else {
			currentColor = textColors[currentWordCounter];
		}
		currentWordCounter++;
		
		//Fill in the completeCanvas
			//Fill based upon pxWidth scaling (pxWidth by pxWidth area)
		for (var j=0;j<4*pxWidth;j+=4) {
			for (var k=0;k<pxWidth;k++) {
				fillCompletePixel(i+j+(4*k*width), currentColor);
			}
		}
	}	
	
	//Puts the ImageData objects onto their canvases
	unitContext.putImageData(unitImgData,0,0);	
	completeContext.putImageData(completeImgData,0,0);
}

/*
	Pad single-digit strings with a preceding zero.
*/
function pad(str) {
	if (str.length<2) {
		str = "0" + str;
	}
	return str;
}

/*
	Calculate the mean value of an array.
*/
function mean (arr) {
	var total = 0;
	for (var i=0; i<arr.length; i++) {
		total += arr[i];
	}
	return total/arr.length;
}

/*
	Create a color object with R,G,B properties.
	Default Color is black.
*/
function Color() {
	this.R = 0;
	this.G = 0;
	this.B = 0;
}

/*
	Accepts a color object and converts it into  
	a hex color in the format #rrggbb
*/
function hexifyColor(aColor) {
	
	var colorStr = "#";
	colorStr += pad(aColor.R.toString(16));
	colorStr += pad(aColor.G.toString(16));
	colorStr += pad(aColor.B.toString(16));
	
	return colorStr;
}

/*
	Using characters a-z & 0-9, assign each
	character an abitrary color in #rrggbb format
*/
var colorMap = {
	"A": "#ffffff", //white
	"B": "#262626", //dark-grey
	"C": "#660000", //blood-red
	"D": "#cc0000", //red
	"E": "#cc2900", //red-orange
	"F": "#cc5200", //orange
	"G": "#663300", //brown
	"H": "#ff8c1a", //yellow-orange
	"I": "#ffcc00", //yellow
	"J": "#997300", //bronze
	"K": "#ff99c2", //pink
	"L": "#ffaa80", //salmon
	"M": "#ffff99", //chatruese
	"N": "#80ff00", //lime
	"O": "#b3ffff", //ice-blue
	"P": "#b30086", //magenta
	"Q": "#40bf40", //green
	"R": "#003300", //forest
	"S": "#00b386", //teal
	"T": "#0000b3", //blue
	"U": "#00004d", //navy
	"V": "#3d0099", //indigo
	"W": "#8600b3", //violet
	"X": "#330033", //royal-purple
	"Y": "#cccccc", //light-grey
	"Z": "#000000", //black
	"0": "#ba2a2a", //brick
	"1": "#471900", //chocolate
	"2": "#f4f4b2", //cream
	"3": "#a5ae85", //sage
	"4": "#006032", //jade
	"5": "#4a6365", //slate
	"6": "#8fcfff", //sky
	"7": "#c5b9f6", //lavender
	"8": "#f983c4", //bubblegum
	"9": "#c5aa77" //tan
};