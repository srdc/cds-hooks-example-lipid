/**
 * Created by gokce on 2/17/2017.
 */

var express = require('express');
var router = express.Router();

/*
To Validate CDS-Hooks interfaces

var validator=require('cds-validator');

var validateDiscoveryResponse=validator.DiscoveryResponse;
var validateCard=validator.Card;
*/

router.get('/cds-services', function(req, res) {

        var cdsServiceResponse = {"services":[{"id":"nice-cg181","hook":"careplan-create",
            "name":"Managing lipids and cardiovascular risk in Type 2 Diabetes patients",
            "description":"NICE guideline -Cardiovascular disease: risk assessment and reduction, including lipid modification, Chapter 1.3.20-1.3.51",
            "prefetch":{"patient":"Patient/{{Patient.id}}",
                "conditions":"Condition?patient={{Patient.id}}&_count=1000",
                "medications":"MedicationStatement?patient={{Patient.id}}&_count=1000",
                "height":"Observation?patient={{Patient.id}}&code=8302-2&_count=1&_sort:desc=date",
                "weight":"Observation?patient={{Patient.id}}&code=29463-7&_count=1&_sort:desc=date",
                "bloodpressure":"Observation?patient={{Patient.id}}&code=55284-4&_count=1&_sort:desc=date",
                "cholesterol":"Observation?patient={{Patient.id}}&code=2093-3&_sort:desc=date",
                "hdl":"Observation?patient={{Patient.id}}&code=2085-9&_count=1&_sort:desc=date",
                "ldl":"Observation?patient={{Patient.id}}&code=13457-7&_sort:desc=date",
                "eGFR":"Observation?patient={{Patient.id}}&code=33914-3&_count=1&_sort:desc=date",
                "familyhistory":"FamilyMemberHistory?patient={{Patient.id}}&_count=100",
                "smokingstatus":"Observation?patient={{Patient.id}}&code=72166-2&_count=1&_sort:desc=date"
                }}]};

         /*validateDiscoveryResponse(cdsServiceResponse).then(function(obj) {
        // do something with the parsed payload
             console.log(obj);
    })
        .catch(function(err) {
            // an array of errors indicating what went wrong
        });
        */
        res.json(cdsServiceResponse);

});

function checkConditionByCode(arr, code) {
    if (arr== undefined) return false;
    for (var i=0, iLen=arr.length; i<iLen; i++) {

        if (arr[i].resource.code.coding[0].code.startsWith(code)) return true;
    }
    return false;
}
function checkConditionByCodes(arr, code) {
    if (arr== undefined) return false;
    for (var i=0, iLen=arr.length; i<iLen; i++) {
        for (var j=0, jLen=code.length; j<jLen; j++) {

            if (arr[i].resource.code.coding[0].code.startsWith(code[j])) return true;
        }
    }
    return false;
}

function checkMedicationsByCodes(arr, code) {
    if (arr== undefined) return false;
    //console.log("medications:"+JSON.stringify(arr));
    for (var i=0, iLen=arr.length; i<iLen; i++) {
        for (var j=0, jLen=code.length; j<jLen; j++) {
            //console.log("medications code:"+JSON.stringify(arr[i].resource.medicationCodeableConcept.coding[0].code));
            if (arr[i].resource.medicationCodeableConcept.coding[0].code.startsWith(code[j])) return true;
        }
    }
    return false;
}

function checkConditionByCodesandAgeinFMH(arr, code, age) {

    if (arr== undefined) return false;

    for (var i=0, iLen=arr.length; i<iLen; i++) {
        //console.log("family history: relationship:"+JSON.stringify(arr[i].resource.relationship.coding[0].code));

        if(arr[i].resource.relationship.coding[0].code=='FTH'||arr[i].resource.relationship.coding[0].code=='MTH'||arr[i].resource.relationship.coding[0].code=='SIB'||arr[i].resource.relationship.coding[0].code=='SIS'||arr[i].resource.relationship.coding[0].code=='BRO') {
            for (var c = 0, cLen = arr[i].resource.condition.length; c<cLen; c++)
            {
               // console.log("family history: age:"+JSON.stringify(arr[i].resource.condition[c].onsetAge.value));
                if ((arr[i].resource.condition[c].onsetAge.value < age)) {
                  //  console.log("family history: code:" + JSON.stringify(arr[i].resource.condition[c].code.coding[0].code));
                    for (var j = 0, jLen = code.length; j < jLen; j++) {

                        if ((arr[i].resource.condition[c].code.coding[0].code == code[j])) return true;
                    }
                }
            }
        }
    }
    return false;
}

function calculateAge(birthday){

    var ageDifMs = Date.now() - birthday.getTime();
    var ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function qrisk2(age,gender,smokingstatuscode,t1d,t2d,anginaorheartattackinfamilyhistory,ckd, atrialfibrillation,isOnBPTreatment,ra,cholestelolratio,systolicbp,height,weight) {

    var b_AF;
    if(atrialfibrillation==false) b_AF=0; else b_AF=1;

    var b_ra;
    if(ra==false) b_ra=0; else b_ra=1;

    var b_renal;

    if(ckd==false) b_renal=0; else b_renal=1;
    var b_treatedhyp;
    if(isOnBPTreatment==false) b_treatedhyp=0; else b_treatedhyp=1;
    var b_type1;
    if(t1d==false) b_type1=0; else b_type1=1;
    var b_type2;
    if(t2d==false) b_type2=0; else b_type2=1;
    var bmi= (weight/ ((height/100)*(height/100)));
    var ethrisk=0;
    var fh_cvd;
    if(anginaorheartattackinfamilyhistory==false) fh_cvd=0; else fh_cvd=1;
    var rati=cholestelolratio;
    var sbp=systolicbp;
    var smoke_cat;
    if(smokingstatuscode=='266919005') smoke_cat=0;
    else if(smokingstatuscode=='702975009') smoke_cat=1;
    else if(smokingstatuscode=='428061000124105'||smokingstatuscode=='428041000124106') smoke_cat=2;
    else if(smokingstatuscode=='428071000124103') smoke_cat=4;
    else if(smokingstatuscode=='449868002'||smokingstatuscode=='428041000124106	') smoke_cat=3;


    var surv=0;
    var town=0;

    if(gender=='male'){

        return qrisk2m(age,b_AF,b_ra,b_renal,b_treatedhyp,b_type1,b_type2,bmi,ethrisk,fh_cvd,rati,sbp,smoke_cat,surv,town);

        }
        else if(gender=='female'){
        return qrisk2m(age,b_AF,b_ra,b_renal,b_treatedhyp,b_type1,b_type2,bmi,ethrisk,fh_cvd,rati,sbp,smoke_cat,surv,town);
    }

}
/*
The following qrisk2m and qrisk2f functions are adopted from the open source implementation of QRISK2-2015
(http://qrisk.org, http://qrisk.org/QRISK2-2015-lgpl-source.tgz)

 QRISK2-2015 is free software: you can redistribute it and/or modify
 it under the terms of the GNU Lesser General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 */
function qrisk2m(age,b_AF,b_ra,b_renal,b_treatedhyp,b_type1,b_type2,bmi,ethrisk,fh_cvd,rati,sbp,smoke_cat,surv,town){

    surv = 10;

    var survivor = [0,0,0,0,0,0,0,0,0,0,0.978794217109680,0,0,0,0,0];
    /* The conditional arrays */

    var Iethrisk = [
        0,
        0,
        0.3173321430481919100000000,
        0.4738590786081115500000000,
        0.5171314655968145500000000,
        0.1370301157366419200000000,
        -0.3885522304972663900000000,
        -0.3812495485312194500000000,
        -0.4064461381650994500000000,
        -0.2285715521377336100000000];
    var Ismoke= [
        0,
        0.2684479158158020200000000,
        0.6307674973877591700000000,
        0.7178078883378695700000000,
        0.8704172533465485100000000];

    /* Applying the fractional polynomial transforms */
    /* (which includes scaling)                      */

    var dage = age;
    dage=dage/10;
    var age_1 = Math.pow(dage,-1);
    var age_2 = Math.pow(dage,2);
    var dbmi = bmi;
    dbmi=dbmi/10;
    var bmi_2 = Math.pow(dbmi,-2)*Math.log(dbmi);
    var bmi_1 = Math.pow(dbmi,-2);

    /* Centring the continuous variables */

    age_1 = age_1 - 0.233734160661697;
    age_2 = age_2 - 18.304403305053711;
    bmi_1 = bmi_1 - 0.146269768476486;
    bmi_2 = bmi_2 - 0.140587374567986;
    rati = rati - 4.321151256561279;
    sbp = sbp - 130.589752197265620;
    town = town - 0.551009356975555;

    /* Start of Sum */
    var a=0;

    /* The conditional sums */

    a += Iethrisk[ethrisk];
    a += Ismoke[smoke_cat];

    /* Sum from continuous values */

    a += age_1 * -18.0437312550377270000000000;
    a += age_2 * 0.0236486454254306940000000;
    a += bmi_1 * 2.5388084343581578000000000;
    a += bmi_2 * -9.1034725871528597000000000;
    a += rati * 0.1684397636136909500000000;
    a += sbp * 0.0105003089380754820000000;
    a += town * 0.0323801637634487590000000;

    /* Sum from boolean values */

    a += b_AF * 1.0363048000259454000000000;
    a += b_ra * 0.2519953134791012600000000;
    a += b_renal * 0.8359352886995286000000000;
    a += b_treatedhyp * 0.6603459695917862600000000;
    a += b_type1 * 1.3309170433446138000000000;
    a += b_type2 * 0.9454348892774417900000000;
    a += fh_cvd * 0.5986037897136281500000000;

    /* Sum from interaction terms */

    a += age_1 * (smoke_cat==1) * 0.6186864699379683900000000;
    a += age_1 * (smoke_cat==2) * 1.5522017055600055000000000;
    a += age_1 * (smoke_cat==3) * 2.4407210657517648000000000;
    a += age_1 * (smoke_cat==4) * 3.5140494491884624000000000;
    a += age_1 * b_AF * 8.0382925558108482000000000;
    a += age_1 * b_renal * -1.6389521229064483000000000;
    a += age_1 * b_treatedhyp * 8.4621771382346651000000000;
    a += age_1 * b_type1 * 5.4977016563835504000000000;
    a += age_1 * b_type2 * 3.3974747488766690000000000;
    a += age_1 * bmi_1 * 33.8489881012767600000000000;
    a += age_1 * bmi_2 * -140.6707025404897100000000000;
    a += age_1 * fh_cvd * 2.0858333154353321000000000;
    a += age_1 * sbp * 0.0501283668830720540000000;
    a += age_1 * town * -0.1988268217186850700000000;
    a += age_2 * (smoke_cat==1) * -0.0040893975066796338000000;
    a += age_2 * (smoke_cat==2) * -0.0056065852346001768000000;
    a += age_2 * (smoke_cat==3) * -0.0018261006189440492000000;
    a += age_2 * (smoke_cat==4) * -0.0014997157296173290000000;
    a += age_2 * b_AF * 0.0052471594895864343000000;
    a += age_2 * b_renal * -0.0179663586193546390000000;
    a += age_2 * b_treatedhyp * 0.0092088445323379176000000;
    a += age_2 * b_type1 * 0.0047493510223424558000000;
    a += age_2 * b_type2 * -0.0048113775783491563000000;
    a += age_2 * bmi_1 * 0.0627410757513945650000000;
    a += age_2 * bmi_2 * -0.2382914909385732100000000;
    a += age_2 * fh_cvd * -0.0049971149213281010000000;
    a += age_2 * sbp * -0.0000523700987951435090000;
    a += age_2 * town * -0.0012518116569283104000000;

    var score = 100.0 * (1 - Math.pow(survivor[surv], Math.exp(a)) );
    return score;

}
function qrisk2f(age,b_AF,b_ra,b_renal,b_treatedhyp,b_type1,b_type2,bmi,ethrisk,fh_cvd,rati,sbp,smoke_cat,surv,town){

    surv = 10;

    var survivor = [0,0,0,0,0,0,0,0,0,0,0.989747583866119,0,0,0,0,0];
    /* The conditional arrays */

    var Iethrisk = [
        0,
        0,
        0.2574099349831925900000000,
        0.6129795430571779400000000,
        0.3362159841669621300000000,
        0.1512517303224336400000000,
        -0.1794156259657768100000000,
        -0.3503423610057745400000000,
        -0.2778372483233216800000000,
        -0.1592734122665366000000000];
    var Ismoke= [
        0,
        0.2119377108760385200000000,
        0.6618634379685941500000000,
        0.7570714587132305600000000,
        0.9496298251457036000000000];

    /* Applying the fractional polynomial transforms */
    /* (which includes scaling)                      */

    var dage = age;
    dage=dage/10;
    var age_1 = Math.pow(dage,0.5);
    var age_2 = dage;
    var dbmi = bmi;
    dbmi=dbmi/10;
    var bmi_2 = Math.pow(dbmi,-2)*Math.log(dbmi);
    var bmi_1 = Math.pow(dbmi,-2);

    /* Centring the continuous variables */

    age_1 = age_1 - 2.086397409439087;
    age_2 = age_2 - 4.353054523468018;
    bmi_1 = bmi_1 - 0.152244374155998;
    bmi_2 = bmi_2 - 0.143282383680344;
    rati = rati - 3.506655454635620;
    sbp = sbp - 125.040039062500000;
    town = town - 0.416743695735931;

    /* Start of Sum */
    var a=0;

    /* The conditional sums */

    a += Iethrisk[ethrisk];
    a += Ismoke[smoke_cat];

    /* Sum from continuous values */

    a += age_1 * 4.4417863976316578000000000;
    a += age_2 * 0.0281637210672999180000000;
    a += bmi_1 * 0.8942365304710663300000000;
    a += bmi_2 * -6.5748047596104335000000000;
    a += rati * 0.1433900561621420900000000;
    a += sbp * 0.0128971795843613720000000;
    a += town * 0.0664772630011438850000000;

    /* Sum from boolean values */

    a += b_AF * 1.6284780236484424000000000;
    a += b_ra * 0.2901233104088770700000000;
    a += b_renal * 1.0043796680368302000000000;
    a += b_treatedhyp * 0.6180430562788129500000000;
    a += b_type1 * 1.8400348250874599000000000;
    a += b_type2 * 1.1711626412196512000000000;
    a += fh_cvd * 0.5147261203665195500000000;

    /* Sum from interaction terms */

    a += age_1 * (smoke_cat==1) * 0.7464406144391666500000000;
    a += age_1 * (smoke_cat==2) * 0.2568541711879666600000000;
    a += age_1 * (smoke_cat==3) * -1.5452226707866523000000000;
    a += age_1 * (smoke_cat==4) * -1.7113013709043405000000000;
    a += age_1 * b_AF * -7.0177986441269269000000000;
    a += age_1 * b_renal * -2.9684019256454390000000000;
    a += age_1 * b_treatedhyp * -4.2219906452967848000000000;
    a += age_1 * b_type1 * 1.6835769546040080000000000;
    a += age_1 * b_type2 * -2.9371798540034648000000000;
    a += age_1 * bmi_1 * 0.1797196207044682300000000;
    a += age_1 * bmi_2 * 40.2428166760658140000000000;
    a += age_1 * fh_cvd * 0.1439979240753906700000000;
    a += age_1 * sbp * -0.0362575233899774460000000;
    a += age_1 * town * 0.3735138031433442600000000;
    a += age_2 * (smoke_cat==1) * -0.1927057741748231000000000;
    a += age_2 * (smoke_cat==2) * -0.1526965063458932700000000;
    a += age_2 * (smoke_cat==3) * 0.2313563976521429400000000;
    a += age_2 * (smoke_cat==4) * 0.2307165013868296700000000;
    a += age_2 * b_AF * 1.1395776028337732000000000;
    a += age_2 * b_renal * 0.4356963208330940600000000;
    a += age_2 * b_treatedhyp * 0.7265947108887239600000000;
    a += age_2 * b_type1 * -0.6320977766275653900000000;
    a += age_2 * b_type2 * 0.4023270434871086800000000;
    a += age_2 * bmi_1 * 0.1319276622711877700000000;
    a += age_2 * bmi_2 * -7.3211322435546409000000000;
    a += age_2 * fh_cvd * -0.1330260018273720400000000;
    a += age_2 * sbp * 0.0045842850495397955000000;
    a += age_2 * town * -0.0952370300845990780000000;

    var score = 100.0 * (1 - Math.pow(survivor[surv], Math.exp(a)) );
    return score;

}
// Implementation of NICE guideline -Cardiovascular disease: risk assessment and reduction, including lipid modification, Chapter 1.3.20-1.3.51
router.post('/cds-services/nice-cg181', function(req, res){

    var cards=[];
    if(req.body.prefetch.conditions.resource!=undefined)
    var conditions=req.body.prefetch.conditions.resource.entry;

    if(req.body.prefetch.height.resource!=undefined)
    var height=req.body.prefetch.height.resource.entry[0].resource.valueQuantity.value;
    if(req.body.prefetch.weight.resource!=undefined)
    var weight=req.body.prefetch.weight.resource.entry[0].resource.valueQuantity.value;
    if(req.body.prefetch.smokingstatus.resource!=undefined)
    var smokingstatuscode=req.body.prefetch.smokingstatus.resource.entry[0].resource.valueCodeableConcept.coding[0].code;

    if(req.body.prefetch.cholesterol.resource!=undefined)
    var cholestelol=req.body.prefetch.cholesterol.resource.entry[0].resource.valueQuantity.value
    if(req.body.prefetch.hdl.resource!=undefined)
    var hdl=req.body.prefetch.hdl.resource.entry[0].resource.valueQuantity.value;
    if(req.body.prefetch.ldl.resource!=undefined)
    var ldl=req.body.prefetch.ldl.resource.entry[0].resource.valueQuantity.value;
    if(req.body.prefetch.eGFR.resource!=undefined)
    var eGFR=req.body.prefetch.eGFR.resource.entry[0].resource.valueQuantity.value;

    var systolicbp;
    var diastolicbp;
    if(req.body.prefetch.bloodpressure.resource!=undefined) {
        var comp1 = req.body.prefetch.bloodpressure.resource.entry[0].resource.component[0];
        var comp2 = req.body.prefetch.bloodpressure.resource.entry[0].resource.component[1];
        if (comp1.code.coding[0].code == '8480-6') systolicbp = comp1.valueQuantity.value; else if (comp1.code.coding[0].code == '8462-4') diastolicbp = comp1.valueQuantity.value;
        if (comp2.code.coding[0].code == '8480-6') systolicbp = comp2.valueQuantity.value; else if (comp2.code.coding[0].code == '8462-4') diastolicbp = comp2.valueQuantity.value;
    }

    var t1d= checkConditionByCode(conditions,'E10');
    var t2d= checkConditionByCode(conditions,'E11');
    var ckd4= checkConditionByCode(conditions,'N18.4');
    var ckd5= checkConditionByCode(conditions,'N18.5');
    var atrialfibrillation =checkConditionByCodes(conditions,['I48.0','I48.1','I48.2','I48.3','I48.4','I48.9']);
    var cvd=checkConditionByCodes(conditions,['I48.0','I48.1','I48.2','I48.3','I48.4','I48.9','I24.9','I21.0', 'I21.1','I21.2','I21.3','I21.4','I20.0']);
    var ra= checkConditionByCode(conditions,'M05');
    var ckd=checkConditionByCodes(conditions,['N18.0','N18.1','N18.2','N18.3','N18.4','N18.5','N18.9']);

    if(req.body.prefetch.medications.resource!=undefined)
     var medications=req.body.prefetch.medications.resource.entry;
    var isOnBPTreatment=checkMedicationsByCodes(medications,['C02','C03','C07','C08','C09']);

    if(req.body.prefetch.familyhistory.resource!=undefined)
    var familyhistory=req.body.prefetch.familyhistory.resource.entry;
    var anginaorheartattackinfamilyhistory=checkConditionByCodesandAgeinFMH(familyhistory,['I20.0','I21'],60);

    var patient=req.body.prefetch.patient.resource;
    var dob=patient.birthDate;
    var age=calculateAge(new Date(dob));
    var gender=patient.gender;

    var cvdrisk=qrisk2(age,gender,smokingstatuscode,t1d,t2d,anginaorheartattackinfamilyhistory,ckd5||ckd4, atrialfibrillation,isOnBPTreatment,ra,cholestelol/hdl,systolicbp,height,weight);

    /*console.log("Patient Data");
    console.log("t1d:"+JSON.stringify(t1d));
    console.log("t2d:"+JSON.stringify(t2d));
    console.log("ckd:"+JSON.stringify(ckd));
    console.log("ckd4:"+JSON.stringify(ckd4));
    console.log("ckd5:"+JSON.stringify(ckd5));
    console.log("atrialfibrillation:"+JSON.stringify(atrialfibrillation));
    console.log("cvd:"+JSON.stringify(cvd));
    console.log("ra:"+JSON.stringify(ra));
    console.log("HEIGHT:"+JSON.stringify(height));
    console.log("WEIGHT:"+JSON.stringify(weight));
    console.log("Systolib BP:"+JSON.stringify(systolicbp));
    console.log("Diastolic BP:"+JSON.stringify(diastolicbp));
    console.log("Cholesterol:"+JSON.stringify(cholestelol));
    console.log("HDL:"+JSON.stringify(hdl));
    console.log("LDL:"+JSON.stringify(ldl));
    console.log("Smoking status Code:"+JSON.stringify(smokingstatuscode));
    console.log("Is on BP Treatment:"+JSON.stringify(isOnBPTreatment));
    console.log("Heart Attack in Family Members befor age of 60:"+JSON.stringify(anginaorheartattackinfamilyhistory));
    console.log("Age:"+JSON.stringify(age));
    console.log("QRISK2:"+JSON.stringify(cvdrisk));

     */

    var patientName = "";
    if (patient.name && patient.name.length > 0) {
        if (patient.name[0].given) { for (var i = 0; i < patient.name[0].given.length; i++) { patientName += patient.name[0].given[i] + " "; } }
        patientName += patient.name[0].family || "";
    }

    if(t2d&!ckd){
        console.log("Lipid lowering in type 2 diabetes without CKD");
        //Lipid lowering in type 2 diabetes without CKD


        if(cvd){
            //Indication for secondary cardiovascular prevention
            //Input:NoCKD-CVD
            console.log("Indication for secondary cardiovascular prevention");
            cards.push({
                    summary: 'Recommendation for Statin treatment in people with CVD with atorvastatin 80 mg',
                    detail: 'Offer atorvastatin 80 mg. See also NICE guidelines for cardiovascular disease (CG181)',
                    source: {
                        label: 'NICE guideline “Cardiovascular disease: risk assessment and reduction, including lipid modification, Chapter 1.3.20-1.3.51 [49, pp. 20–26].',
                        url: 'https://www.nice.org.uk/guidance/CG181'
                    },
                    suggestions:[{
                        label:'Atorvastatin Recommendation-80mg',
                        uuid:'5esgu69c-9457-405c-d697-1d58jl2f3dad',
                        create: [{
                            "resourceType": "MedicationRequest",
                            "status": "draft",
                            "intent": "plan",
                            "medicationCodeableConcept": {
                                "coding": [{
                                    "system": "http://www.whocc.no/atc",
                                    "code": "C10AA05",
                                    "display": "atorvastatin"
                                }]
                            },
                            "subject": {
                                "reference": "Patient/" + patient.id,
                                "display": patientName
                            },
                            "dosageInstruction": [{
                                "sequence": 1,
                                "text": "80mg Atorvastatin daily",
                                "maxDosePerPeriod": {
                                    "numerator": {
                                        "value": 80,
                                        "unit": "mg",
                                        "system": "http://unitsofmeasure.org",
                                        "code": "mg"
                                    },
                                    "denominator": {
                                        "value": 1,
                                        "unit": "day",
                                        "system": "http://unitsofmeasure.org",
                                        "code": "d"
                                    }
                                }
                            }]
                        }]
                    }],
                    indicator: 'info'
                }
            );
        }
        else{
            //No Indication for secondary cardiovascular prevention


            //Measure and evaluate QRISK2
            console.log("No Indication for secondary cardiovascular prevention");

            if(cvdrisk>=10){

                //Offer atorvastation 20 mg
                var isOnAtorvastatin=checkMedicationsByCodes(medications,['C10AA05']);

                var appointmentdate= new Date();
                var mo=appointmentdate.getUTCMonth();
                appointmentdate.setUTCMonth(mo+3);

                if(isOnAtorvastatin==false) {
                    //Input:NoCKD-CVD-Risk
                    console.log("Atorvastatin Recommendation-20mg");

                    cards.push({
                            summary: 'Atorvastatin Recommendation-20mg',
                            detail: 'Offer atorvastatin 20 mg. See also NICE guidelines for cardiovascular disease (CG181). Add a goal to lower the non-HDL Cholestretol by %40, check non-HDL Cholesterol within three months after starting Atorvastatin',
                            source: {
                                label: 'NICE guideline “Cardiovascular disease: risk assessment and reduction, including lipid modification, Chapter 1.3.20-1.3.51 [49, pp. 20–26].',
                                url: 'https://www.nice.org.uk/guidance/CG181'
                            },
                            suggestions: [{
                                label: 'Offer Starting Statin Treatment ',
                                uuid: '5ecd8b9c-5gae-405c-b377-0c20352f6dad',
                                create: [{
                                    "resourceType": "MedicationRequest",
                                    "status": "draft",
                                    "intent": "plan",
                                    "medicationCodeableConcept": {
                                        "coding": [{
                                            "system": "http://www.whocc.no/atc",
                                            "code": "C10AA05",
                                            "display": "atorvastatin "
                                        }]
                                    },
                                    "subject": {
                                        "reference": "Patient/" + patient.id,
                                        "display": patientName
                                    },
                                    "dosageInstruction": [{
                                        "sequence": 1,
                                        "text": "20mg Atorvastatin daily",
                                        "maxDosePerPeriod": {
                                            "numerator": {
                                                "value": 20,
                                                "unit": "mg",
                                                "system": "http://unitsofmeasure.org",
                                                "code": "mg"
                                            },
                                            "denominator": {
                                                "value": 1,
                                                "unit": "day",
                                                "system": "http://unitsofmeasure.org",
                                                "code": "d"
                                            }
                                        }
                                    }]
                                }]

                            },{
                                label: 'Statin Treatment Followup Goal',
                                uuid: '5esgu69c-9eae-405c-b377-0c20352f6dad',
                                create: [{
                                    "resourceType": "Goal",
                                    "category": [{
                                        "coding": [{
                                            "system": "http://hl7.org/fhir/goal-category",
                                            "code": "safety"
                                        }]
                                    }],
                                    "description": {
                                        "text": "Decrease Non-HDL Cholesterol by %40. Evaluate progress with 3 monthly measurements."
                                    },
                                    "subject": {
                                        "reference": "Patient/" + patient.id,
                                        "display": patientName
                                    },
                                    "target": {
                                        "measure": {
                                            "coding": [
                                                {
                                                    "system": "http://loinc.org",
                                                    "code": "13457-7",
                                                    "display": "Cholesterol in LDL"
                                                }
                                            ]
                                        },
                                        "detailRange": {
                                            "high": {
                                                "value": ldl*0.6,
                                                "unit": "mg/dL",
                                                "system": "http://unitsofmeasure.org/",
                                                "code": "mg/dL"
                                                }
                                        },
                                        "dueDuration": {
                                            "value": 3,
                                            "unit": "month",
                                            "system": "http://unitsofmeasure.org/",
                                            "code": "mo"

                                        }
                                    }

                                } ]

                            }, {
                                label: 'Statin Treatment Followup Appointment',
                                uuid: '5esgu69c-9eae-405c-b377-0c20352f6dad',
                                create: [{
                                    "resourceType": "Appointment",
                                    "id": "appointment-offer",
                                    "status": "proposed",
                                    "appointmentType": {
                                        "coding": [
                                            {
                                                "system": "http://hl7.org/fhir/v2/0276",
                                                "code": "FOLLOWUP",
                                                "display": "FOLLOWUP"
                                            }
                                        ]
                                    },

                                    "description": "Follow up to check the results of Statin Treatment",

                                    "participant": [
                                        {
                                            "actor": {
                                                "reference": "Patient/"+patient.id,
                                                "display": patientName
                                            },
                                            "required": "required",
                                            "status": "needs-action"
                                        },
                                        {
					    "actor": {
                                                "reference": "Practitioner/2-000001",
                                                "display": "Anna Svensson"
                                            },
                                            "type": [
                                                {
                                                    "coding": [
                                                        {
                                                            "system": "http://hl7.org/fhir/v3/ParticipationType",
                                                            "code": "ATND"
                                                        }
                                                    ]
                                                }
                                            ],
                                            "required": "required",
                                            "status": "needs-action"
                                        },
			    		{
				            "actor": {
					        "reference": "Location/l-005",
					        "display": "Östersund Health Care Center"
				            },
				            "required": "required",
				            "status": "accepted"
				        }

                                    ],
                                    "start": appointmentdate,
                                    "end": appointmentdate
                                } ]

                            }],
                            indicator: 'info'
                        }
                    );
                }
                else {
                    //already on Atorvastatin, check whether there is %40 reduction in non-HDL cholesterol

                    if(req.body.prefetch.ldl.resource.entry.length>1) {

                        var appointmentdate= new Date();
                        var yy=appointmentdate.getFullYear();
                        appointmentdate.setFullYear(yy+1);

                        var previousLDL = req.body.prefetch.ldl.resource.entry[1].resource.valueQuantity.value;
                       // console.log("previousLDL:"+JSON.stringify(previousLDL));
                        if (((previousLDL - ldl) / previousLDL) > 0.40) {
                            //Input:NoCKD-CVD-Risk-onStatinRLDL
                            //Continue treatment and annual follow-up

                            cards.push({
                                    summary: 'Recommendation for an annual follow-up',
                                    detail: 'Continue the treatment and offer annual follow-up',
                                    source: {
                                        label: 'NICE guideline “Cardiovascular disease: risk assessment and reduction, including lipid modification, Chapter 1.3.20-1.3.51 [49, pp. 20–26].',
                                        url: 'https://www.nice.org.uk/guidance/CG181'
                                    },
                                    suggestions:[{
                                        label:'Annual follow-up',
                                        uuid:'5esgu69c-9eae-405c-d687-1d58jl2f6dad',
                                        create: [{
                                            "resourceType": "Appointment",
                                            "id": "appointment-offer",
                                            "status": "proposed",
                                            "appointmentType": {
                                                "coding": [
                                                    {
                                                        "system": "http://hl7.org/fhir/v2/0276",
                                                        "code": "FOLLOWUP",
                                                        "display": "FOLLOWUP"
                                                    }
                                                ]
                                            },

                                            "description": "Annual follow up to check the results of Statin Treatment",

                                            "participant": [
                                                {
                                                    "actor": {
                                                        "reference": "Patient/"+patient.id,
                                                        "display": patientName
                                                    },
                                                    "required": "required",
                                                    "status": "needs-action"
                                                },
                                                {
						    "actor": {
		                                        "reference": "Practitioner/2-000001",
		                                        "display": "Anna Svensson"
		                                    },
                                                    "type": [
                                                        {
                                                            "coding": [
                                                                {
                                                                    "system": "http://hl7.org/fhir/v3/ParticipationType",
                                                                    "code": "ATND"
                                                                }
                                                            ]
                                                        }
                                                    ],
                                                    "required": "required",
                                                    "status": "needs-action"
                                                },
			    		{
				            "actor": {
					        "reference": "Location/l-005",
					        "display": "Östersund Health Care Center"
				            },
				            "required": "required",
				            "status": "accepted"
				        }

                                            ],
                                            "start": appointmentdate,
                                            "end": appointmentdate
                                        } ]
                                    }],
                                    indicator: 'info'
                                }
                            );
                        }
                        else {
                            //Input:NoCKD-CVD-Risk-onStatinHLDL
                            //Discuss adherence, consider increasing the dose of Statin
                            var appointmentdatelow= new Date();
                            var appointmentdatehigh= new Date();
                            var dd=appointmentdate.getDate();
                            appointmentdatehigh.setDate(dd+5);
                            cards.push({
                                    summary: 'Discuss adherence, consider increasing the dose of Statin',
                                    detail: 'Discuss adherence and timing of dose. Optimise adherence to diet and lifestyle measures. Consider increasing the dose if started on less than atorvastatin 80 mg and the person is judged to be at higher risk because of comorbidities, risk score or using clinical judgement',
                                    source: {
                                        label: 'NICE guideline “Cardiovascular disease: risk assessment and reduction, including lipid modification, Chapter 1.3.20-1.3.51 [49, pp. 20–26].',
                                        url: 'https://www.nice.org.uk/guidance/CG181'
                                    },
                                    suggestions:[{
                                        label:'Appointment to discuss adherence',
                                        uuid:'5esgu69c-9eae-405c-d697-1d58jl2f3dad',
                                        create: [ {
                                            "resourceType": "Appointment",
                                            "id": "appointment-offer",
                                            "status": "proposed",
                                            "appointmentType": {
                                                "coding": [
                                                    {
                                                        "system": "http://hl7.org/fhir/v2/0276",
                                                        "code": "FOLLOWUP",
                                                        "display": "FOLLOWUP"
                                                    }
                                                ]
                                            },

                                            "description": "Appointment to discuss adherence to statin treatment, diet & lifestyle measures",

                                            "participant": [
                                                {
                                                    "actor": {
                                                        "reference": "Patient/"+patient.id,
                                                        "display": patientName
                                                    },
                                                    "required": "required",
                                                    "status": "needs-action"
                                                },
                                                {
						    "actor": {
		                                        "reference": "Practitioner/2-000001",
		                                        "display": "Anna Svensson"
		                                    },
                                                    "type": [
                                                        {
                                                            "coding": [
                                                                {
                                                                    "system": "http://hl7.org/fhir/v3/ParticipationType",
                                                                    "code": "ATND"
                                                                }
                                                            ]
                                                        }
                                                    ],
                                                    "required": "required",
                                                    "status": "needs-action"
                                                },
			    		{
				            "actor": {
					        "reference": "Location/l-005",
					        "display": "Östersund Health Care Center"
				            },
				            "required": "required",
				            "status": "accepted"
				        }

                                            ],
                                            "start": appointmentdatelow,
                                            "end": appointmentdatehigh
                                        } ]
                                    },{
                                        label:'Atorvastatin Recommendation-80mg',
                                        uuid:'5esdks9c-9eae-405c-d697-1d58jl2f3dad',
                                        create: [ {
                                            "resourceType": "MedicationRequest",
                                            "status": "draft",
                                            "intent": "plan",
                                            "medicationCodeableConcept": {
                                                "coding": [{
                                                    "system": "http://www.whocc.no/atc",
                                                    "code": "C10AA05",
                                                    "display": "atorvastatin"
                                                }]
                                            },
                                            "subject": {
                                                "reference": "Patient/" + patient.id,
                                                "display": patientName
                                            },
                                            "dosageInstruction": [{
                                                "sequence": 1,
                                                "text": "80mg Atorvastatin daily",
                                                "maxDosePerPeriod": {
                                                    "numerator": {
                                                        "value": 80,
                                                        "unit": "mg",
                                                        "system": "http://unitsofmeasure.org",
                                                        "code": "mg"
                                                    },
                                                    "denominator": {
                                                        "value": 1,
                                                        "unit": "day",
                                                        "system": "http://unitsofmeasure.org",
                                                        "code": "d"
                                                    }
                                                }
                                            }]
                                        }]
                                    }
                                    ],
                                    indicator: 'info'
                                }
                            );
                        }
                    }
                }

            }
        }}

        else if(ckd){
            //Lipid lowering in CKD with or without diabetes
        var isOnAtorvastatin=checkMedicationsByCodes(medications,['C10AA05']);

        if(isOnAtorvastatin==false) {
            //Offer atorvastatin 20mg (Medication Request),
            //Input:CKD

            console.log("Atorvastatin Recommendation-20mg - CKD");
            var appointmentdate= new Date();
            var mo=appointmentdate.getUTCMonth();
            appointmentdate.setUTCMonth(mo+3);
            cards.push({
                    summary: 'Atorvastatin Recommendation-20mg',
                    detail: 'Offer atorvastatin 20 mg. See also NICE guidelines for cardiovascular disease (CG181). Add a goal to lower the non-HDL Cholestretol by %40, check non-HDL Cholesterol within three months after starting Atorvastatin',
                    source: {
                        label: 'NICE guideline “Cardiovascular disease: risk assessment and reduction, including lipid modification, Chapter 1.3.20-1.3.51 [49, pp. 20–26].',
                        url: 'https://www.nice.org.uk/guidance/CG181'
                    },
                    suggestions: [{
                        label: 'Offer Starting Statin Treatment ',
                        uuid: '5ecd8b9c-5gae-405c-b377-0c20352f6dad',
                        create: [{
                            "resourceType": "MedicationRequest",
                            "status": "draft",
                            "intent": "plan",
                            "medicationCodeableConcept": {
                                "coding": [{
                                    "system": "http://www.whocc.no/atc",
                                    "code": "C10AA05",
                                    "display": "atorvastatin"
                                }]
                            },
                            "subject": {
                                "reference": "Patient/" + patient.id,
                                "display": patientName
                            },
                            "dosageInstruction": [{
                                "sequence": 1,
                                "text": "20mg Atorvastatin daily",
                                "maxDosePerPeriod": {
                                    "numerator": {
                                        "value": 20,
                                        "unit": "mg",
                                        "system": "http://unitsofmeasure.org",
                                        "code": "mg"
                                    },
                                    "denominator": {
                                        "value": 1,
                                        "unit": "day",
                                        "system": "http://unitsofmeasure.org",
                                        "code": "d"
                                    }
                                }
                            }]
                        }]

                    },{
                        label: 'Statin Treatment Followup Goal',
                        uuid: '5esgu69c-9eae-405c-b377-0c20352f6dad',
                        create: [{
                            "resourceType": "Goal",
                            "category": [{
                                "coding": [{
                                    "system": "http://hl7.org/fhir/goal-category",
                                    "code": "safety"
                                }]
                            }],
                            "description": {
                                "text": "Decrease Non-HDL Cholesterol by %40. Evaluate progress with 3 monthly measurements."
                            },
                            "subject": {
                                "reference": "Patient/" + patient.id,
                                "display": patientName
                            },
                            "target": {
                                "measure": {
                                    "coding": [
                                        {
                                            "system": "http://loinc.org",
                                            "code": "13457-7",
                                            "display": "Cholesterol in LDL"
                                        }
                                    ]
                                },
                                "detailRange": {
                                    "high": {
                                        "value": ldl*0.6,
                                        "unit": "mg/dL",
                                        "system": "http://unitsofmeasure.org/",
                                        "code": "mg/dL"
                                    }
                                },
                                "dueDuration": {
                                    "value": 3,
                                    "unit": "month",
                                    "system": "http://unitsofmeasure.org/",
                                    "code": "mo"

                                }
                            }

                        }]

                    }, {
                        label: 'Statin Treatment Followup Appointment',
                        uuid: '5esgu69c-9eae-405c-b377-0c20352f6dad',
                        create: [{
                            "resourceType": "Appointment",
                            "id": "appointment-offer",
                            "status": "proposed",
                            "appointmentType": {
                                "coding": [
                                    {
                                        "system": "http://hl7.org/fhir/v2/0276",
                                        "code": "FOLLOWUP",
                                        "display": "FOLLOWUP"
                                    }
                                ]
                            },

                            "description": "Follow up to check the results of Statin Treatment",

                            "participant": [
                                {
                                    "actor": {
                                        "reference": "Patient/"+patient.id,
                                        "display": patientName
                                    },
                                    "required": "required",
                                    "status": "needs-action"
                                },
                                {
				    "actor": {
                                        "reference": "Practitioner/2-000001",
                                        "display": "Anna Svensson"
                                    },
                                    "type": [
                                        {
                                            "coding": [
                                                {
                                                    "system": "http://hl7.org/fhir/v3/ParticipationType",
                                                    "code": "ATND"
                                                }
                                            ]
                                        }
                                    ],
                                    "required": "required",
                                    "status": "needs-action"
                                },
			    		{
				            "actor": {
					        "reference": "Location/l-005",
					        "display": "Östersund Health Care Center"
				            },
				            "required": "required",
				            "status": "accepted"
				        }

                            ],
                            "start": appointmentdate,
                            "end": appointmentdate
                        } ]

                    }],
                    indicator: 'info'
                }
            );
        }
        else {
            //already on Atorvastatin, check whether there is %40 reduction in non-HDL cholesterol

            if(req.body.prefetch.ldl.resource.entry.length>1) {

                var appointmentdate= new Date();
                var yy=appointmentdate.getFullYear();
                appointmentdate.setFullYear(yy+1);

                var previousLDL = req.body.prefetch.ldl.resource.entry[1].resource.valueQuantity.value;
               // console.log("previousLDL:"+JSON.stringify(previousLDL));
                if (((previousLDL - ldl) / previousLDL) > 0.40) {
                    //Continue treatment and annual follow-up
                    //Input:CKD.onStatinRDLD
                   // console.log("Continue treatment and annual follow-up");
                    cards.push({
                            summary: 'Recommendation for an annual follow-up',
                            detail: 'Continue the treatment and offer annual follow-up',
                            source: {
                                label: 'NICE guideline “Cardiovascular disease: risk assessment and reduction, including lipid modification, Chapter 1.3.20-1.3.51 [49, pp. 20–26].',
                                url: 'https://www.nice.org.uk/guidance/CG181'
                            },
                            suggestions:[{
                                label:'Annual follow-up',
                                uuid:'5esgu69c-9eae-405c-d687-1d58jl2f6dad',
                                create: [{
                                    "resourceType": "Appointment",
                                    "id": "appointment-offer",
                                    "status": "proposed",
                                    "appointmentType": {
                                        "coding": [
                                            {
                                                "system": "http://hl7.org/fhir/v2/0276",
                                                "code": "FOLLOWUP",
                                                "display": "FOLLOWUP"
                                            }
                                        ]
                                    },

                                    "description": "Annual follow up to check the results of Statin Treatment",

                                    "participant": [
                                        {
                                            "actor": {
                                                "reference": "Patient/"+patient.id,
                                                "display": patientName
                                            },
                                            "required": "required",
                                            "status": "needs-action"
                                        },
                                        {
					    "actor": {
                                                "reference": "Practitioner/2-000001",
                                                "display": "Anna Svensson"
                                            },
                                            "type": [
                                                {
                                                    "coding": [
                                                        {
                                                            "system": "http://hl7.org/fhir/v3/ParticipationType",
                                                            "code": "ATND"
                                                        }
                                                    ]
                                                }
                                            ],
                                            "required": "required",
                                            "status": "needs-action"
                                        },
			    		{
				            "actor": {
					        "reference": "Location/l-005",
					        "display": "Östersund Health Care Center"
				            },
				            "required": "required",
				            "status": "accepted"
				        }
                                    ],
                                    "start": appointmentdate,
                                    "end": appointmentdate
                                }]
                            }],
                            indicator: 'info'
                        }
                    );
                }
                else {
                    //Input:CKD.onStatinRDLD
                    if(eGFR>=30){
                        //Increase dose
                        cards.push({
                                summary: 'Recommendation for increasing the dose of Statin treatment (atorvastatin 80 mg)',
                                detail: 'Increase the dose of atorvastatin to 80 mg. See also NICE guidelines for cardiovascular disease (CG181)',
                                source: {
                                    label: 'NICE guideline “Cardiovascular disease: risk assessment and reduction, including lipid modification, Chapter 1.3.20-1.3.51 [49, pp. 20–26].',
                                    url: 'https://www.nice.org.uk/guidance/CG181'
                                },
                                suggestions:[{
                                    label:'Atorvastatin Recommendation-80mg',
                                    uuid:'5esgu69c-9457-405c-d697-1d58jl2f3dad',
                                    create:[{
                                        "resourceType": "MedicationRequest",
                                        "status": "draft",
                                        "intent": "plan",
                                        "medicationCodeableConcept": {
                                            "coding": [{
                                                "system": "http://www.whocc.no/atc",
                                                "code": "C10AA05",
                                                "display": "atorvastatin"
                                            }]
                                        },
                                        "subject": {
                                            "reference": "Patient/" + patient.id,
                                            "display": patientName
                                        },
                                        "dosageInstruction": [{
                                            "sequence": 1,
                                            "text": "80mg Atorvastatin daily",
                                            "maxDosePerPeriod": {
                                                "numerator": {
                                                    "value": 80,
                                                    "unit": "mg",
                                                    "system": "http://unitsofmeasure.org",
                                                    "code": "mg"
                                                },
                                                "denominator": {
                                                    "value": 1,
                                                    "unit": "day",
                                                    "system": "http://unitsofmeasure.org",
                                                    "code": "d"
                                                }
                                            }
                                        }]
                                    } ]
                                }],
                                indicator: 'info'
                            }
                        );
                    }
                    else {
                        //Agree on an increased dose with a renal specialists
                        cards.push({
                                summary: 'Referral to a Renal Specialist to agree on an increased ststin dose',
                                detail: 'Referral to a Renal Specialist to agree on an increased statin dose',
                                source: {
                                    label: 'NICE guideline “Cardiovascular disease: risk assessment and reduction, including lipid modification, Chapter 1.3.20-1.3.51 [49, pp. 20–26].',
                                    url: 'https://www.nice.org.uk/guidance/CG181'
                                },
                                suggestions:[{
                                    label:'Referral to a Renal Specialist to agree on an increased ststin dose',
                                    uuid:'5esgu69c-9eae-405c-d687-1d54jk2f6dad',
                                    create: [{
                                        "resourceType": "ReferralRequest",
                                        "id": "29442",
                                        "meta": {
                                            "versionId": "1",
                                            "lastUpdated": "2017-02-22T09:38:16.214-05:00",
                                            "profile": [
                                                "http://hl7.org/fhir/StructureDefinition/ReferralRequest"
                                            ]
                                        },
                                        "status": "active",
                                        "category": "plan",
                                        "subject": {
                                            "reference": "Patient/"+patient.id,
                                            "display": patientName
                                        },
                                       "specialty": {
                                            "coding": [
                                                {
                                                    "system": "http://snomed.info/sct",
                                                    "code": "11911009",
                                                    "display": "Nephrologist"
                                                }
                                            ],
                                            "text": "Dietitian"
                                        },
                                        "reason": {
                                            "coding": [
                                                {
                                                    "system": "http://hl7.org/fhir/sid/icd-10",
                                                    "code": "N18.4",
                                                    "display": "Chronic kidney disease, stage 4 (severe)"
                                                }
                                            ],
                                            "text": "Chronic kidney disease, stage 4 (severe)"
                                        },
                                        "description": "Referral to a Renal Specialist to agree on an increased statin dose for lipid lowering, Proposed dose 80mg"
                                    }]
                                }],
                                indicator: 'info'
                            }
                        );

                    }
                }
            }
        }

    }
    var cdsServiceResponse={"cards": cards};

     /*
        validateCard(JSON.stringify(cdsServiceResponse)).then(function(obj) {
        // do something with the parsed payload
        console.log("VALIDATED");
        //console.log(obj);
    })
        .catch(function(err) {
            // an array of errors indicating what went wrong

            console.log("ERROR:"+ err);
        });
        */



    res.json(cdsServiceResponse);
})

module.exports = router;
