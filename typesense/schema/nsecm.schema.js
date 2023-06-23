module.exports = {
    "name": "nsecm",
    "fields": [
      {
        "name": "ExchangeSegment",
        "type": "string",
        "facet": false
      },
      {
        "name": "ExchangeInstrumentID",
        "type": "string",
        "facet": false
      },
      {
        "name": "InstrumentType",
        "type": "string",
        "facet": true
      },
      {
        "name": "Name",
        "type": "string",
        "facet": true
      },
      {
        "name": "Description",
        "type": "string",
        "facet": true
      },
      {
        "name": "Month",
        "type": "string",
        "facet": false,
        "sort": true
      },
      {
        "name": "Series",
        "type": "string",
        "facet": false
      },
      {
        "name": "Series_Key",
        "type": "string",
        "facet": false
      },
      {
        "name": "NameWithSeries",
        "type": "string",
        "facet": false
      },
      {
        "name": "InstrumentID",
        "type": "string",
        "facet": true
      },
      {
        "name": "PriceBandHigh",
        "type": "string",
        "facet": false
      },
      {
        "name": "PriceBandLow",
        "type": "string",
        "facet": true
      },
      {
        "name": "FreezeQty",
        "type": "string",
        "facet": false
      },
      {
        "name": "TickSize",
        "type": "string",
        "facet": true
      },
      {
        "name": "LotSize",
        "type": "string",
        "facet": false
      },
      {
        "name": "Multiplier",
        "type": "string",
        "facet": true
      }
    ],
    "token_separators": ["."]
}
  