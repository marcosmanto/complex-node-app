exports.cleanObject = function(obj, allowedProperties, transformations) {
  let objValues = Object.values(obj)
  transformations.forEach(transformation => objValues = objValues.map(transformation))

  return objValues.reduce((cleanedObject, val, i) => {
      if(allowedProperties.includes(Object.keys(obj)[i])) {
          cleanedObject[Object.keys(obj)[i]] = val
      }
      return cleanedObject
  }, {})
}

