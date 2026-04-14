export function resolveTemplate(
  templateName: string,
  category: string,
  values: string[],
  usedValues: Set<string>,
): string | null {
  const placeholder = `[${category}]`

  const available = values.filter((value) => {
    const resolved = templateName.replace(placeholder, value)
    return !usedValues.has(resolved)
  })

  if (available.length === 0) {
    return null
  }

  const chosen = available[Math.floor(Math.random() * available.length)]
  const resolved = templateName.replace(placeholder, chosen)
  usedValues.add(resolved)

  return resolved
}
