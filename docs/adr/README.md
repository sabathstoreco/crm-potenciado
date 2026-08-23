# Registros de Decisión de Arquitectura (ADR)

Un ADR se escribe cuando una decisión de [04-stack-tecnologico.md](../04-stack-tecnologico.md)
o [03-arquitectura.md](../03-arquitectura.md) cambia, o cuando se resuelve una pregunta
bloqueante de [12](../12-riesgos-y-preguntas-abiertas.md).

## Formato

Archivo: `NNNN-titulo-en-kebab-case.md`

```markdown
# NNNN · Título

- **Estado:** propuesto | aceptado | reemplazado por NNNN
- **Fecha:** YYYY-MM-DD
- **Decide:** quién

## Contexto
Qué situación obliga a decidir. Hechos, no opiniones.

## Decisión
Qué se decidió, en voz activa: "Usamos X".

## Alternativas consideradas
Cada una con por qué se descartó. Una alternativa sin razón de descarte
no fue considerada de verdad.

## Consecuencias
Lo bueno y lo malo. Especialmente lo malo — es lo que alguien va a
necesitar leer en seis meses cuando esta decisión duela.
```

## Índice

_(vacío — el primer ADR se escribe cuando se resuelva B3, la ubicación de Postgres)_
