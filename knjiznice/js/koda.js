
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */

function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */

// podatki za paciente
var imena = ["Pacient", "Pacient", "Pacient"];
var priimki = ["Kronik", "Sportnik", "Otrok"];
var datumiRojstva = ["1950-01-01T00:00", "1990-10-10T10:10", "2005-05-05T05:05"];
var visina = [175, 185, 150];
var teza = [90, 80, 40]
var sisTlak = [160, 105, 90];
var diaTlak = [100, 70, 60];
var temperatura = [37.4, 36.5, 39];
var kisik = [94, 98, 96];
var id = [0,0,0];

// funkcija, ki se izvede ob pritisku gumba "Generiranje podatkov"
function generiraj() {
    generirajPodatke(1);
    generirajPodatke(2);
    generirajPodatke(3);
}

function generirajPodatke(stPacienta) {
    var sessionId = getSessionId();
    var ehrId = "";
    
    var ime = imena[stPacienta-1];
    var priimek = priimki[stPacienta-1];
    var datumRojstva = datumiRojstva[stPacienta-1];

	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 || priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		console.log("Napaka!");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		    	
		        var ehrId = data.ehrId;
		        id[stPacienta-1] = ehrId;
		        
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    console.log("Uspeh!");
		                    var dodaj = "<option value=\"" + id[stPacienta-1] + "\">" + ime + " " + priimek + "</option>";
		                    console.log(dodaj);
		                    $("#izbiraBolnika").append(dodaj);
		                    dodajMeritve(stPacienta-1);
		                    $("#obvestilo").append("<span class=\"label label-success fade-in\">EHR ID pacienta " + stPacienta + ": " + id[stPacienta-1] + ".</span>");
		                }
		            },
		            error: function(err) {
                    	console.log(JSON.parse(err.responseText).userMessage + "'!");
		            }
		        });
		    }
		});
	}

    return ehrId;
}

//dodamo 10 meritev vitalnih znakov
function dodajMeritve(stPacienta) {
	for(var i = 0; i < 10; i++) {
		
		var sessionId = getSessionId();
		$.ajaxSetup({
			headers: { "Ehr-Session": sessionId }
		});
		
		var datumInUra = (2006+i)+"-01-01T12:00";
		var telesnaTeza = Math.floor(teza[stPacienta] + (Math.pow((-1), Math.round(Math.random())))*Math.random()*5);
		var telesnaTemperatura = temperatura[stPacienta] + (Math.pow((-1), Math.round(Math.random())))*Math.random()/2;
		var sistolicniKrvniTlak = Math.floor(sisTlak[stPacienta] + (Math.pow((-1), Math.round(Math.random())))* (Math.random()*20));
		var diastolicniKrvniTlak = Math.floor(diaTlak[stPacienta] + (Math.pow((-1), Math.round(Math.random())))* (Math.random()*10)); 
		var nasicenostKrviSKisikom = Math.floor(kisik[stPacienta] + (Math.pow((-1), Math.round(Math.random())))* (Math.random())/2);
		
		var podatki = {
		    "ctx/language": "en",
		    "ctx/territory": "SI",
		    "ctx/time": datumInUra,
		    "vital_signs/height_length/any_event/body_height_length": visina[stPacienta],
		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
		};
		
		var parametri = {
			ehrId: id[stPacienta],
			templateId: 'Vital Signs',
			format: 'FLAT',
			committer: 'Generator'
		};
		
		$.ajax({
			url: baseUrl + "/composition?" + $.param(parametri),
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify(podatki),
			success: function (res) {
				console.log("Uspeh: dodajMeritve()!");
			},
			error: function (err) {
				console.log(JSON.parse(err.responseText).userMessage);
			}
		});
	}
}

// prikaze 'okvircke', ki so bili prej skriti
function showData() {
	$("#osnovniPodatki").show();
	$("#meritve").show();
	$("#tlakSkoziCas").show();
	$("#graf").show();
	$("#osnova").show();
	$("#twitter").show();
}

// odstrani 'okvircke', ce je prislo do napake
function hideData() {
	$("#podatki").hide();
	$("#meritve").hide();
	$("#tlakSkoziCas").hide();
	$("#graf").hide();
	$("#osnova").hide();
	$("#twitter").hide();
}

function prikaziPodatke() {
	showData();
	
	var a = document.getElementById("izbiraBolnika");
	var EHR = a.options[a.selectedIndex].value;
	ponastavi();
	
	if(EHR || EHR.trim().length !== 0 || EHR.length !== 0) napolni(EHR);
	else hideData();
}

function prikaziPodatkeEHR() {
	showData();
	
	var EHR = $("#preberiEHR").val();
	ponastavi();
	
	if(EHR || EHR.trim().length !== 0 || EHR.length !== 0) napolni(EHR);
	else hideData();
}

// ce zelimo prikazati drugega bolnika moramo zbrisati vsebino okvirjev
function ponastavi() {
	var a = document.getElementById("osnovniPodatki");
	a.innerHTML = "";
	a = document.getElementById("tlakSkoziCas");
	a.innerHTML = "";
	a = document.getElementById("visina");
	a.innerHTML = "";
	a = document.getElementById("kisik");
	a.innerHTML = "";
	a = document.getElementById("sisTlak");
	a.innerHTML = "";
	a = document.getElementById("diaTlak");
	a.innerHTML = "";
	a = document.getElementById("temperatura");
	a.innerHTML = "";
	a = document.getElementById("teza");
	a.innerHTML = "";
}

// napolni 'okvircke' s podatki bolnika
function napolni (EHR) {
	var sessionId = getSessionId();
	console.log("EHR v prikazi(EHR): " + EHR);
	
	// osnovniPodatki
	$.ajax({
		url: baseUrl + "/demographics/ehr/" + EHR + "/party",
		type: 'GET',
		headers: {
			"Ehr-Session": sessionId
		},
		success: function (data) {
			var party = data.party;
			var dodaj = "<p class=\"p3\">Ime bolnika:<span style=\"margin-left: 32px\" class=\"p6\">" + party.firstNames + " " + party.lastNames + "</span></p>";
			$("#osnovniPodatki").append(dodaj);
			var dodaj = "<p class=\"p3\">Datum rojstva:<span style=\"margin-left: 15px\" class=\"p6\">" + party.dateOfBirth.substring(0, 10) + "</span></p>";
			$("#osnovniPodatki").append(dodaj);
			var dodaj = "<p class=\"p3\">EHR ID:<span style=\"margin-left: 63px\" class=\"p6\">" + EHR + "</span></p>";
			$("#osnovniPodatki").append(dodaj);
		},
		error: function (err) {
			console.log("Napaka pri prikazu!");
		}
	});
	
	// visina
	$.ajax({
		url: baseUrl + "/view/" + EHR + "/height",
		type: 'GET',
		headers: {
			"Ehr-Session": sessionId
		},
		success: function (res) {
			var dodaj = "<center><p class=\"p4\">Višina</p><br><p class=\"p5\">" + res[0].height + " cm<br></p></center>";
			$("#visina").append(dodaj);
		}
	});
	// teza
	$.ajax({
	    url: baseUrl + "/view/" + EHR + "/weight",
	    type: 'GET',
	    headers: {
	        "Ehr-Session": sessionId
	    },
	    success: function (res) {
	        var dodaj = "<center><p class=\"p4\">Teža</p><br><p class=\"p5\">" + res[0].weight + " kg<br></p></center>";
			$("#teza").append(dodaj);
	    }
	});
	
	// tlak
	$.ajax({
		url: baseUrl + "/view/" + EHR + "/blood_pressure",
		type: 'GET',
		headers: {
			"Ehr-Session": sessionId
		},
		success: function (res) {
			var dodaj = "<center><p class=\"p4\">Sistolični tlak</p><br><p class=\"p5\">" + res[0].systolic + " mmHg<br></p></center>";
			$("#sisTlak").append(dodaj);
			var dodaj = "<center><p class=\"p4\">Diastolični tlak</p><br><p class=\"p5\">" + res[0].diastolic + " mmHg<br></p></center>";
			$("#diaTlak").append(dodaj);
			preglejTlak(res[0].systolic, res[0].diastolic);
		}
	});
	
	// kisik
	$.ajax({
	    url: baseUrl + "/view/" + EHR + "/spO2",
	    type: 'GET',
	    headers: {
	        "Ehr-Session": sessionId
	    },
	    success: function (res) {
	        var dodaj = "<center><p class=\"p4\">Nasičenost krvi</p><br><p class=\"p5\">" + res[0].spO2 + " %<br></p></center>";
			$("#kisik").append(dodaj);
			preglejKisik(res[0].spO2);
	    }
	});
	
	// temperatura
	$.ajax({
	    url: baseUrl + "/view/" + EHR + "/body_temperature",
	    type: 'GET',
	    headers: {
	        "Ehr-Session": sessionId
	    },
	    success: function (res) {
	    	var temp = res[0].temperature.toString().substring(0,4);
	        var dodaj = "<center><p class=\"p4\">Temperatura</p><br><p class=\"p5\">" + temp + " °C<br></p></center>";
			$("#temperatura").append(dodaj);
			preglejTemperaturo(temp);
	    }
	});
	
	
	// narisi graf
	$("#tlakSkoziCas").append("<svg id=\"visualisation\" width=\"100%\" height=\"400\"></svg>");
	$.ajax({
		url: baseUrl + "/view/" + EHR + "/blood_pressure",
		type: 'GET', 
		headers: {
			"Ehr-Session": sessionId
		},
		success: function (lineData) {
			console.log("Line data: " + lineData);
			var vis = d3.select("#visualisation"),
			WIDTH = $("#visualisation").width(),
			HEIGHT = 400,
			MARGINS = {
				top: 30,
				right: 30,
				bottom: 30,
				left: 30
			},
			xRange = d3.scale.linear().range([MARGINS.left, WIDTH - MARGINS.right]).domain([
				d3.min(lineData, function(d) {
					var date = d.time.split("-");
					return parseInt(date[0]);
				}),
				d3.max(lineData, function(d) {
					var date = d.time.split("-");
					return parseInt(date[0]);
				})
			]),
			yRange = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([
				d3.min(lineData, function(d) {
					return (d.diastolic - 5);	
				}),
				d3.max(lineData, function(d) {
					return (d.systolic + 5);
				})
			]),
			
			xAxis = d3.svg.axis()
					.scale(xRange)
					.tickSize(5)
					.tickFormat(d3.format("d"))
					.tickSubdivide(true);
					
			yAxis = d3.svg.axis()
					.scale(yRange)
					.tickSize(5)
					.orient("left")
					.tickSubdivide(true);
					
			vis.append("svg:g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + (HEIGHT - MARGINS.bottom) + ")")
					.call(xAxis);

					vis.append("svg:g")
					.attr("class", "y axis")
					.attr("transform", "translate(" + (MARGINS.left) + ",0)")
					.call(yAxis);

					var lineFunc1 = d3.svg.line()
					.x(function (d) {
						var datum = d.time.split("-");
						return xRange(parseInt(datum[0]));
					})
					.y(function (d) {
						return yRange(d.systolic);
					})
					.interpolate('basis');
					
					var lineFunc2 = d3.svg.line()
					.x(function (d) {
						var datum = d.time.split("-");
						return xRange(parseInt(datum[0]));
					})
					.y(function (d) {
						return yRange(d.diastolic);
					})
					.interpolate('basis');

					vis.append("svg:path")
					.attr("d", lineFunc1(lineData))
					.attr("stroke", "#337ab7")
					.attr("stroke-width", 3)
					.attr("fill", "none");
					
					vis.append("svg:path")
					.attr("d", lineFunc2(lineData))
					.attr("stroke", "#E4FFBC")
					.attr("stroke-width", 3)
					.attr("fill", "none");
		}
	});
}

// dobro: E4FFBC, srednjedobro: FFFDCE, slabo: FFC6B9
// http://www.bloodpressureuk.org/BloodPressureandyou/Thebasics/Bloodpressurechart

function preglejTlak(s, d) {
	if(s >= 140) {
		$("#sisTlak").css("background-color", "#FFC6B9");
	}
	else if(s < 140 && s >= 120) {
		$("#sisTlak").css("background-color", "#FFFDCE");
	}
	else if(s < 120 && s >= 90) {
		$("#sisTlak").css("background-color", "#E4FFBC");
	}
	else if(s < 90 && s >= 70) {
		$("#sisTlak").css("background-color", "#FFFDCE");
	}
	else {
		$("#sisTlak").css("background-color", "#FFC6B9");
	}
	
	if(d >= 90) {
		$("#diaTlak").css("background-color", "#FFC6B9");
	}
	else if(d < 90 && d >= 80) {
		$("#diaTlak").css("background-color", "#FFFDCE");
	}
	else if(d < 80 && d >= 60) {
		$("#diaTlak").css("background-color", "#E4FFBC");
	}
	else if(d < 60 && d >= 40) {
		$("#diaTlak").css("background-color", "#FFFDCE");
	}
	else {
		$("#diaTlak").css("background-color", "#FFC6B9");
	}
}

function preglejKisik(kisik) {
	if(kisik >= 100 || kisik < 90) {
		$("#kisik").css("background-color", "#FFC6B9");
	}
	else if(kisik >= 97 && kisik < 100) {
		$("#kisik").css("background-color", "#E4FFBC");
	}
	else {
		$("#kisik").css("background-color", "#FFFDCE");
	}
}

function preglejTemperaturo(t) {
	var t = parseFloat(t);
	if(t < 37.5 && t > 36) {
		$("#temperatura").css("background-color", "#E4FFBC");
	}
	else if((t >= 37.5 && t <= 38.3) || (t > 35 && t <= 36)) {
		$("#temperatura").css("background-color", "#FFFDCE");
	}
	else if(t > 38.3 || t <= 35) {
		$("#temperatura").css("background-color", "#FFC6B9");
	}
}