export function optionList(items, getter, labeler = (value) => value) {
  return [...new Set(items.flatMap((item) => valueArray(getter(item))).filter(Boolean))]
    .sort((left, right) => String(labeler(left)).localeCompare(String(labeler(right)), undefined, { sensitivity: "base" }))
    .map((value) => ({
      value,
      label: labeler(value)
    }));
}

export function valueArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return value === undefined || value === null || value === "" ? [] : [value];
}
