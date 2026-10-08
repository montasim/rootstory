export const matchesSelectOption = (label: string, query: string) =>
  label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
