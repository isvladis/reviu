# Reviu — contexto para Claude Code

Antes de cualquier tarea, lee ARQUITECTURA.md en la raíz. Es la única fuente de verdad sobre estructura, modelo de datos, convenciones y seguridad. No tomes decisiones de arquitectura que contradigan ese documento sin añadir primero un ADR en §9.

## Reglas de sesión
- Cada prompt es autónomo: asume que no tienes historial de chats anteriores.
- Si tocas el modelo de datos o cambias una convención, actualiza ARQUITECTURA.md en el mismo commit.
- Al cerrar un chat largo, genera un resumen breve: qué se hizo, archivos tocados, qué falta.