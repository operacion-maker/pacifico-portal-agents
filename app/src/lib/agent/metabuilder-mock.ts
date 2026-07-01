export function getMetaBuilderMockResponse(): string {
  // Simulates a full response from the MetaBuilder pipeline
  // It uses markdown code blocks with special languages to render interactive components

  return `Iniciando proceso de documentación inteligente...

\`\`\`json:metabuilder-pipeline
{
  "currentStep": "collect_context"
}
\`\`\`

He analizado la tabla y recolectado el contexto técnico. Generando el draft inicial...

\`\`\`json:metabuilder-pipeline
{
  "currentStep": "generate_draft"
}
\`\`\`

\`\`\`json:metabuilder-draft
{
  "tableName": "udv_desa.sch_udv_tbl.ha_jerarquia_producto_gen_core",
  "tableComment": "Tabla core que almacena la jerarquía consolidada de productos de seguros de Pacífico, permitiendo el análisis dimensional de ventas y siniestros por diferentes niveles de agrupación de productos.",
  "columns": [
    { "name": "producto_sk", "type": "bigint", "comment": "Clave subrogada única (Surrogate Key) para la dimensión de producto." },
    { "name": "codigo_producto", "type": "string", "comment": "Código natural del producto en los sistemas transaccionales (Ej. 'POL-AUTO-01')." },
    { "name": "nombre_producto", "type": "string", "comment": "Nombre comercial del producto de seguro." },
    { "name": "linea_negocio", "type": "string", "comment": "Línea de negocio a la que pertenece el producto (Ej. 'Salud', 'Vehículos', 'Vida')." },
    { "name": "fecha_creacion", "type": "timestamp", "comment": "Fecha y hora en que se registró el producto en el Data Lakehouse." },
    { "name": "es_activo", "type": "boolean", "comment": "Indicador (1/0) del estado comercial del producto; 1 si está vigente para la venta." }
  ]
}
\`\`\`

Evaluando la calidad del draft generado...

\`\`\`json:metabuilder-pipeline
{
  "currentStep": "evaluate_quality"
}
\`\`\`

\`\`\`json:metabuilder-quality
{
  "score": 0.85,
  "pillars": {
    "clarity": 0.90,
    "purpose": 0.85,
    "detail": 0.80,
    "context": 0.85
  },
  "findings": [
    "La descripción de la tabla es clara y establece el propósito analítico.",
    "Las claves primarias (producto_sk) están debidamente documentadas.",
    "Sugerencia: Podría añadirse información sobre la frecuencia de actualización."
  ]
}
\`\`\`

Verificando cumplimiento de los principios de gobernanza corporativa...

\`\`\`json:metabuilder-pipeline
{
  "currentStep": "reflect_governance"
}
\`\`\`

\`\`\`json:metabuilder-governance
{
  "status": "needs_review",
  "findings": [
    "Cumple con estándar de nomenclatura (snake_case).",
    "Los campos booleanos inician correctamente con prefijo 'es_' o 'tiene_'.",
    "Falta clasificar la sensibilidad del campo 'nombre_producto' según políticas de seguridad de la información."
  ]
}
\`\`\`

Esperando revisión del Data Steward...

\`\`\`json:metabuilder-pipeline
{
  "currentStep": "human_review"
}
\`\`\`

\`\`\`json:metabuilder-hitl
{
}
\`\`\`
`;
}
