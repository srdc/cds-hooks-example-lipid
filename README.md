# Try it out

Demo service is already available at http://app.srdc.com.tr/cds-demo


# Deploy your own service

### Setup

Install `nodejs`  and `npm` and then:
```
npm install -g nodemon

cd cds-demo
npm install
```

### Run it

CDS service
```
cd cds-demo
nodemon
```

### Calling CDS services

You can call the rest service via any rest client you like, e.g. curl, postman plugin of Chrome...

There are two services:
1. CDS Discovery Service: The discovery endpoint is always available at {baseUrl}/cds-services. For example, if the baseUrl is http://app.srdc.com.tr/cds-demo, you can call via:

```
GET http://app.srdc.com.tr/cds-demo/cds-services
```

If you have deployed your own service, you can call it via:
```
GET http://localhost:3000/cdsapi/cds-services/
```

This will return you the 'services' object containing a list of CDS Services.

In our example it is: 
```
{
  "services": [
    {
      "id": "nice-cg181",
      "hook": "careplan-create",
      "name": "Managing lipids and cardiovascular risk in Type 2 Diabetes patients",
      "description": "NICE guideline -Cardiovascular disease: risk assessment and reduction, including lipid modification, Chapter 1.3.20-1.3.51",
      "prefetch": {
        "patient": "Patient/{{Patient.id}}",
        "conditions": "Condition?patient={{Patient.id}}&_count=1000",
        "medications": "MedicationStatement?patient={{Patient.id}}&_count=1000",
        "height": "Observation?patient={{Patient.id}}&code=8302-2&_count=1&_sort:desc=date",
        "weight": "Observation?patient={{Patient.id}}&code=29463-7&_count=1&_sort:desc=date",
        "bloodpressure": "Observation?patient={{Patient.id}}&code=55284-4&_count=1&_sort:desc=date",
        "cholesterol": "Observation?patient={{Patient.id}}&code=2093-3&_sort:desc=date",
        "hdl": "Observation?patient={{Patient.id}}&code=2085-9&_count=1&_sort:desc=date",
        "ldl": "Observation?patient={{Patient.id}}&code=13457-7&_sort:desc=date",
        "eGFR": "Observation?patient={{Patient.id}}&code=33914-3&_count=1&_sort:desc=date",
        "familyhistory": "FamilyMemberHistory?patient={{Patient.id}}&_count=100",
        "smokingstatus": "Observation?patient={{Patient.id}}&code=72166-2&_count=1&_sort:desc=date"
      }
    }
  ]
}
```
Currently a single service has been implemented, i.e. "nice-cg181", based on the "NICE guideline CD181:Cardiovascular disease: risk assessment and reduction,
including lipid modification, Chapter 1.3.20-1.3.51".

As can be seen, in the prefetch object, an object is returned containing the key/value pairs of the data elements and the FHIR queries that this service would like the client to prefetch and provide on
each service call. The key is a string that describes the type of data being requested and the value is a string representing the FHIR query. 


2. The "nice-cg181" service, which takes the current medical summary of the patient with in the prefetch object and returns an array of Cards 
which convey a combination of text (information card) description of the decision support (i.e. the proposed goals and activities that can be added to the care plan of the patient),
 and suggestions (suggestion card). Suggestions are represented as FHIR Goal or Activity resources (in our example the proposed type of activities include MedicationRequest, Appointment
 and ReferralRequest).

The service is hosted at "{baseUrl}/cds-services/nice-cg181"

Sample input to test for each branch identified in the flowcharts are available under cds-demo/public/test/sample-inputs.

Detailed description of the pre-fetch configuration of each sample input is available at cds-demo/public/test/sample-inputs/Sample-CDS-Service.xlsx . 

If the baseUrl is http://app.srdc.com.tr/cds-demo, you can invoke it as follows:

```
cd public/test/sample-inputs
curl
  -X POST \
  -H 'Content-type: application/json' \
  --data @CKD.json
  "http://app.srdc.com.tr/cds-demo/cds-services/nice-cg181"
```

If you have deployed your own service you can call it via:
```
cd public/test/sample-inputs
curl
  -X POST \
  -H 'Content-type: application/json' \
  --data @CKD.json
  "http://localhost:3000/cdsapi/cds-services/nice-cg181"
```