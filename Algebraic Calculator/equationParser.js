// Global variables
var opHelper = new expressionOperations();

/*
	Based on the input determine whether we need to simplify or solve,
	and if solving is it a single- or multi-variable system.
*/
function inputHandler(input) {

	var output;

	if (input.includes('=')) {
		if (input.includes(',')) {
			output = multiVariableSolver(input.split(','));
		}
		else {
			output = [singleVariableSolver(input)];
		}
		output = valueToString(output);
	}
	else {
		output = expressionToString(simplifyExpression(input));
	}
	
	if (output === "") {
		output = "Error. Check input.";
	}

	return(output);
}

/*
	Given an expression object, convert into a string which
	separates all terms by addition
*/
function expressionToString(expression) {
	
	var str = "";
	for (var key in expression) {
		str += expression[key].toFraction(false) + key + "+";
	}
	
	return str.slice(0, -1).replace(/_/g, "");
}

/*
	Given an array of [variable, value] tuples, convert into a 
	string assigning each variable to it's value.
*/
function valueToString(valueSet) {

	var str = "";
	for (var i=valueSet.length-1; i>=0; i--) {
		if (valueSet[i][1] === '@') {
			return "All Solutions";
		}
		else if (valueSet[i][1] === '!') {
			return "No Solution";
		}
		else {
			str += valueSet[i][0] + "=" + valueSet[i][1] + ", ";
		}
	}
	return str.slice(0,-2);
}

/*
	Reduce input to a standard form for processing.
	Remove white space, change dashes to a simple
	hyphen and eliminate extra negatives.
*/
function normalizeString(str) {
	
	str = str.replace(/\s/g,''); // Remove white space
	str = str.replace(/\u2013|\u2014/g,'-'); // Replace &ndash or &mdash with simple dash
	
	// Reduce consecutive negative signs Ex. ---2 = -2 
	var repeatedMinus = str.match(/--+/g);
	if (repeatedMinus) {
		for (var i=0; i<repeatedMinus.length; i++) {
			var reduced;
			if (repeatedMinus[i].length%2 === 0) {
				reduced = new RegExp(repeatedMinus);
				str = str.replace(reduced,'+');
			}
			else {
				reduced = new RegExp(repeatedMinus);
				str = str.replace(reduced,'-');
			}
		}
	}
	
	str = str.replace(/\+-/g,'-'); // Addition of a negative is just subtraction
	return str;
}

/*
	Basic mathematical operations (+,-,*,/,^) for 
	use with whole expressions. To access, create an
	expressionOperations variable and use .add(...) etc
	
	Utilize Fraction.js to increase precision
*/
function expressionOperations() {
	
	/*
		Operation helper functions. Implement rules for variable operations.
		expression parameters = {
			'x': <coefficient>,
			'y': <coefficient>,
			'_': <zero-power>
		}
	*/
	
	/*
		If a term exists in both expression then add the
		right and the left, otherwise add with zero (included
		for clarity but could be changed to self-assignment)
	*/
	this.add = function add(expression1, expression2) {
			
		var result = {};
			
		for (var key1 in expression1) {
			if (expression2[key1]) {
				result[key1] = Fraction(expression1[key1]).add(expression2[key1]);
			}
			else {
				result[key1] = Fraction(expression1[key1]).add(0);
			}
		}
		for (var key2 in expression2) {
			if (!expression1[key2]) {
				result[key2] = Fraction(0).add(expression2[key2]);
			}
		}
		return result;
	}
	
	/*
		If a term exists in both expressions then subtract the 
		right from the left, otherwise subtract with zero.
	*/
	this.subtract = function subtract(expression1, expression2) {
		
		var result = {};
			
		for (var key1 in expression1) {
			if (expression2[key1]) {
				result[key1] = Fraction(expression1[key1]).sub(expression2[key1]);
			}
			else {
				result[key1] = Fraction(expression1[key1]).sub(0);
			}
		}
		for (var key2 in expression2) {
			if (!expression1[key2]) {
				result[key2] = Fraction(0).sub(expression2[key2]);
			}
		}
		return result;
	}
	
	/*
		Determine which expression is the scalar, and multiply all
		terms in the other expression by that value.
	*/
	this.multiply = function multiply(expression1, expression2) {
			
		var result = {};
		var keys1 = Object.keys(expression1);
		var keys2 = Object.keys(expression2);
			
		if (keys1.length === 1 && keys1[0] === '_') {
			for (var i=0; i<keys2.length; i++) {
				result[keys2[i]] = Fraction(expression1[keys1[0]]).mul(expression2[keys2[i]]);
			}
		}
		else if (keys2.length === 1 && keys2[0] === '_') {
			for (var i=0; i<keys1.length; i++) {
				result[keys1[i]] =  Fraction(expression1[keys1[i]]).mul(expression2[keys2[0]]);
			}
		}
		else {
			//Attempted x*y or other unanticipated exception
			alert("Don't Panic.");
		}
		return result;
	}
	
	/*
		Determine which expression is the scalar and divide all
		terms in the other expression by that value. Also accept
		division of like terms both of power 1.
	*/
	this.divide = function divide(expression1, expression2) {
			
		var result = {};
		var keys1 = Object.keys(expression1);
		var keys2 = Object.keys(expression2);
			
		if (keys1.length === 1 && keys1[0] === '_') {
			for (var i=0; i<keys2.length; i++) {
				result[keys2[i]] = Fraction(expression1[keys1[0]]).div(expression2[keys2[i]]);
			}
		}
		else if (keys2.length === 1 && keys2[0] === '_') {
			for (var i=0; i<keys1.length; i++) {
				result[keys1[i]] = Fraction(expression1[keys1[i]]).div(expression2[keys2[0]]);
			}
		}
		// Special case where x/x = 1
		else if (keys1.length === 1 && keys2.length === 1 && keys1[0] === keys2[0]) {
			result['_'] = Fraction(expression1[keys1[0]]).div(expression2[keys2[0]]);
		}
		else {
			//Attempted x/y or other unanticipated exception
			alert("Don't Panic.");
		}
		return result;
	}
	/*
		Allow contant values to be raised to constant powers.
	*/
	this.raise = function raise(expression1, expression2) {
		
		var result = {};
		var variableCheck = [];
		
		variableCheck = Object.keys(expression1);
		variableCheck.concat(Object.keys(expression2));
		
		for (var i=0; i<variableCheck.length; i++) {
			if (variableCheck[i] !== '_') {
				// Only handles linear equations
				alert("Don't Panic.");
			}
		}
		
		result['_'] = expression1['_'].pow(expression2['_']);
		return result;
	}
}

/*
	HACKED TO PLAY NICELY WITH MULTIVARIABLESOLVER
	RETURNS THE SUBSTITUTED VARIABLE WITH A COEFFICIENT
	OF ZERO INSTEAD OF REMOVING THAT TERM

	Substitute known values for a given variable into a simplified 
	expression and return the resulting expression. Handles 
	substitution into multi-variable expression through multiple 
	function calls.
	
	expression 4x + 3 = {'x':4, '_':3}
	value (x = 2) = ['x',{'_':2}] 
	or value (x = (t - 3)) = ['x', {'t':1, '_':-3}]
*/
function substitute(expression, value) {
	
		var result = {};
		
		result['_'] =  new Fraction(expression[value[0]]);
		result = opHelper.multiply(result, value[1]);
		
		expression[value[0]] = new Fraction(0);
		result = opHelper.add(result, expression);
		
		return result;
}

/*
	Given a first- or zero-order expression combine all like terms 
	and return the expression in its simplest form as an object of
	variable-coefficient pairs. Numerical term is stored under the 
	key '_'
	
	Ex.
	simplifyExpression("4x+9*2-(x*3)") --> {'_':18, 'x':1} ~~ x + 18
*/
function simplifyExpression(str) {
	
	return initiateEquationTree(str);
	
	/*
		Build a tree for general arithmetic equations. Operators serve as inner nodes
		and numerical terms serve as leaves. Tree is constructed with higher order
		operations at a greater depth than low order operations.
	*/
	function constructEquationTree(str, currentNode){
		
		var inParen = false;
		var parenCount = 0;
		
		var opOrder = 2;
		var lowestOrderIndex = -1;
		
		while (lowestOrderIndex === -1) {
			/* 
				Base case registers when a valid numerical term is passed
				Variable terms in the form 4x+7+2y --> {'x':4, '_':7, 'y':2}
				where coefficients are stored as Fractions 
			*/
			// Any number
			if (/^(?=.*\d)\d*(?:\.\d*)?$/.test(str)) {			
				var term = {};
				term['_'] = new Fraction(parseFloat(str));
				
				return term;
			}
			// Any number appended by a letter
			else if (/^(?:(?=.*\d)\d*(?:\.\d*)?)?[a-z]$/.test(str)) {	
				var key = str.slice(-1);
				var term = {};
				
				if (str.length > 1) {
					term[key] = new Fraction(parseFloat(str.slice(0,-1)));
				}
				else {
					term[key] = new Fraction(1);
				}
				
				return term;
			}
			// Search the current equation for the lowest order operator
				// Precedence follows standard mathematical order of operations
			for (var i=str.length-1;i>=0;i--) {
				if (!inParen && opOrder > 0) {
					if ((str[i] === '-' || str[i] === '+') && opOrder > 0){
						opOrder = 0;
						lowestOrderIndex = i;
					}
					else if ((str[i] === '*' || str[i] === '/') && opOrder > 1) {
						opOrder = 1;
						lowestOrderIndex = i;
					}
					else if (str[i] === '^') {
						opOrder = 2;
						lowestOrderIndex = i;
					}
				}
				/* 
					Track the depth of parentheses to ignore their contents
					until all other operations are registered.
					Interpreted right -> left to maintain left precedence
				*/
				if (str[i] === ')') {
					inParen = true;
					parenCount++;
				}
				else if (str[i] === '(') {
					parenCount--;
					if (parenCount === 0) {
						inParen = false;
					}
				}
			}
			// If no operator was found
			if (lowestOrderIndex === -1) {
				// parentheses surround entire expression
				if (/^\(.+\)$/.test(str)){
					str = str.slice(1,-1); //trim the parentheses from beginning and end
				}
				else {
					// assume invalid input
					// raise an exception and terminate the program
					return null;
				}
			}
		}
		
		currentNode.leftChild = new Node();
		currentNode.rightChild = new Node();
		// special case where the equation has a leading negative term	
			// treat negatives as subtraction from zero
		if (lowestOrderIndex === 0 && str[0] === '-') {
			var term = {};
			term['_'] = new Fraction(0);
			currentNode.leftChild.value = term;
		}
		else {
			currentNode.leftChild.value = constructEquationTree(str.slice(0,lowestOrderIndex),currentNode.leftChild);
		}
		currentNode.rightChild.value = constructEquationTree(str.slice(lowestOrderIndex+1),currentNode.rightChild)
			
		return str[lowestOrderIndex];
	}

	/*
		Instantiate the root node of the tree and request
		an equation tree to be built from the provided string.
	*/
	function initiateEquationTree(str) {
		
		var root = new Node();
		str = normalizeString(str);
		root.value = constructEquationTree(str, root);
		
		return interpretEquationTree(root);
	}

	/*
		Given the root of a mathematical parse tree containing numerical
		and operational (+,-,*,/,^) values, compute the result.
		All direct operations use Fraction Objects to maintain precision
	*/
	function interpretEquationTree(root) {
				
		// Leaves hold simplified terms that can be operated upon
		if (!root.leftChild && !root.rightChild) {
			return root.value;
		}
		
		switch (root.value) {
			case '+':
				return opHelper.add(interpretEquationTree(root.leftChild),interpretEquationTree(root.rightChild));
				break;
			case '-':
				return opHelper.subtract(interpretEquationTree(root.leftChild),interpretEquationTree(root.rightChild));
				break;
			case '*':
				return opHelper.multiply(interpretEquationTree(root.leftChild),interpretEquationTree(root.rightChild));
				break;
			case '/':
				return opHelper.divide(interpretEquationTree(root.leftChild),interpretEquationTree(root.rightChild));
				break;  
			case '^':
				return opHelper.raise(interpretEquationTree(root.leftChild),interpretEquationTree(root.rightChild));
				break;
		}
	}

	/*
		Basic definition of a Node for use in a binary tree.
	*/
	function Node() {

		this.value;
		this.leftChild;
		this.rightChild;
	}
}

/*
	Evalauate an expression in terms of the given variable.
	
	Ex. Given ("y - z = 2", 'y') return [y, 'z + 2']
*/
function evaluateVariable(str, variable) {
	
	var coeff = {};
	var temp = str.split('=');
	//var opHelper = new expressionOperations();
	
	// Send all terms to one side to achieve the form Ax +By + ... + C = 0
	temp = opHelper.subtract(simplifyExpression(temp[0]), simplifyExpression(temp[1]));
	coeff['_'] = temp[variable];
	delete temp[variable];
	
	temp = opHelper.multiply(opHelper.divide(temp, coeff), {'_':-1});
	temp = expressionToString(temp);
	
	return [variable, temp];
}

/*
	Accept an algebraic equation and return a tuple
	of the variable and its value.
	
	Ex.
	4x + 8 = 16 --> ['x',2] ~~ x = 2
*/
function singleVariableSolver(str) {
	
	var keys;
	var token;
	var temp = str.split('=');
	
	// Send all terms to one side to achieve the form Ax +By + ... + C = 0
	temp = opHelper.subtract(simplifyExpression(temp[0]), simplifyExpression(temp[1]));
	token = str.match(/[a-z]/)[0];
	
	if (temp[token].n !== 0) {
		return [token, Fraction(-1).mul((Fraction(temp['_']).div(temp[token]))).toFraction()];
	}
	else {
		if (!temp['_'] || temp['_'].n === 0) {
			return [token, "@"];
		}
		else {
			return [token, "!"];
		}
	}	
}

/*
	FIRST EQUATION MUST BE FILLED
	Accept a series of equations with related
	variables and successively solve for the 
	value of each. Return a tuple array of 
	variables and associated values.
	
	Ex.
	x + y = 10
	-x + 3y = 14  --> [['x',4],['y',6]]
*/
function multiVariableSolver(strArr) {
	
	var equations = [];
	var keys;
	var orderedKeys;
	var result = [];
	
	// Put all equations into the form Ax + By + Cz + D = 0
	for (var i=0; i<strArr.length; i++) {
		var temp = strArr[i].split('=');
		equations.push(opHelper.subtract(simplifyExpression(temp[0]),simplifyExpression(temp[1])));
	}
	// Assume first equation is filled (ie. contains all variables)
	keys = Object.keys(equations[0]);
	
	// Fill equations by assigning missing terms a coefficient of zero
	for (var i=1; i<equations.length; i++) {
		for (var j=0; j<keys.length; j++) {
			if (!equations[i][keys[j]]) {
				equations[i][keys[j]] = new Fraction(0);
			}
		}
	}
	
	// Order of variable keys is irrelevant, but '_' must be at the end
	for (var i=0; i<keys.length ;i++) {
		if (keys[i] === '_') {
			keys.splice(i,1);
			keys.push('_');
			break;
		}
	}
	
	// Elementary row operations to reduce matrix to upper triangular
		// Solution attained by Elimination
	for (var i=0; i<keys.length-2; i++) {
		for (var j=i+1; j<equations.length; j++){
			if (equations[j][keys[i]].n !== 0) {
				var coeff = {};
				coeff['_'] = Fraction(equations[i][keys[i]]).div(equations[j][keys[i]]);
				equations[j] = opHelper.subtract(equations[i],opHelper.multiply(coeff,equations[j]));
			}
		}
	}
	
	/*
		Reduce non-square systems to a squared system, and verify
		that a solution space still exists.
	*/
	if (equations.length > keys.length-1) {
		for (var i=equations.length-1; i >= keys.length-1; i--) {
			var coeff = {};
			coeff['_'] = Fraction(equations[keys.length-2][keys[keys.length-2]]).div(equations[i][keys[keys.length-2]]);
			equations[i] = opHelper.subtract(equations[keys.length-2],opHelper.multiply(coeff,equations[i]));
		}
	}
	// For non-square systems check that the system is still valid
		// and trim excess equations to make the system square
	while (equations.length > keys.length-1) {
		var test = equations.pop();
		
		var stringy = test[keys[keys.length-2]].toFraction();
		stringy = "0=" + stringy + keys[keys.length-2] + "+" + test['_'];
		
		// When any equation in the system has no solution,
			// the entire system has no solution.
		if (singleVariableSolver(stringy)[1] === '!') {
			return [['x', '!']];
		}
	}
	
	// Substitute known values to create single variable equations and solve
	for (var i=equations.length-1; i>=0; i--) {
		
		var stringy = "";
		// Change each equation into a string, ommiting zero-coefficient terms
		stringy += "0=" + equations[i]['_'].toFraction();
		for (var j=0; j<keys.length-1; j++) {
			if (equations[i][keys[j]].n !== 0) {
				stringy += "+" + equations[i][keys[j]].toFraction() + keys[j];	
			}
		}
		// Special cases when an equation contains a free parameter
			// need to accept "0=0+0x" and "0=x+y" 
		if (!stringy.match(/[a-z]/)) {
			stringy += "+0" + keys[i]; 
			result.push(singleVariableSolver(stringy));
		}
		else if (stringy.match(/[a-z]/g).length > 1) {
			result.push(evaluateVariable(stringy, keys[i]));
		}
		else {
			result.push(singleVariableSolver(stringy));
		}
		
		// Prepare the next equation for solving by substituting all known values
		if (i>0) {
			for (var j=0; j<result.length; j++) {
				
				var subValue = {};
				switch(result[j][1]) {
					case '!':
						return [[result[j][0], '!']];
					case '@':
						result[j][1] = result[j][0];
						break;
				}
				
				subValue = simplifyExpression(result[j][1]);
				equations[i-1] = substitute(equations[i-1], [result[j][0],subValue]);
			}
		}
	}
	return result;
}

