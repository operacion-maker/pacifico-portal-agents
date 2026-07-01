const MOCK_RESPONSES = [
  // 1. Rich markdown with headers, lists, blockquotes
  `## Política de Gestión de Datos

La política de gestión de datos establece los lineamientos para el manejo adecuado de la información dentro de la organización.

### Principios Fundamentales

1. **Confidencialidad**: Toda información clasificada debe ser protegida según su nivel de sensibilidad.
2. **Integridad**: Los datos deben mantener su exactitud y completitud durante todo su ciclo de vida.
3. **Disponibilidad**: La información debe estar accesible para los usuarios autorizados cuando la necesiten.

> **Nota importante**: El incumplimiento de estas políticas puede resultar en sanciones disciplinarias según el reglamento interno.

### Clasificación de Datos

- **Público**: Información que puede ser compartida libremente
- **Interno**: Solo para uso dentro de la organización
- **Confidencial**: Acceso restringido a personal autorizado
- **Secreto**: Máximo nivel de restricción

Para más detalles, consulte el documento completo en la base de conocimiento.`,

  // 2. Markdown table
  `## Resumen de Modelos Desplegados

A continuación se muestra el estado actual de los modelos en producción:

| Modelo | Versión | Estado | Precisión | Última Actualización |
|--------|---------|--------|-----------|---------------------|
| Clasificador de Texto | v3.2.1 | Activo | 94.5% | 2025-01-15 |
| Detector de Anomalías | v2.0.0 | Activo | 91.2% | 2025-01-10 |
| Modelo de Recomendación | v1.5.3 | En revisión | 88.7% | 2024-12-20 |
| NER Documentos | v4.1.0 | Activo | 96.1% | 2025-01-18 |
| Sentiment Analysis | v2.3.0 | Degradado | 85.3% | 2024-11-30 |

### Observaciones

- El modelo de **Sentiment Analysis** presenta degradación y requiere reentrenamiento.
- El **Modelo de Recomendación** está pendiente de validación por el equipo de QA.
- Se recomienda priorizar la actualización del pipeline de datos para el detector de anomalías.`,

  // 3. Mermaid diagram (flowchart)
  `## Arquitectura del Pipeline de Datos

El siguiente diagrama muestra el flujo de procesamiento de datos:

\`\`\`mermaid
graph TD
    A["Fuentes de Datos"] --> B["Ingesta Raw"]
    B --> C{"Validacion de Calidad"}
    C -->|Valido| D["Bronze Layer"]
    C -->|Invalido| E["Cola de Errores"]
    D --> F["Transformaciones ETL"]
    F --> G["Silver Layer"]
    G --> H["Agregaciones"]
    H --> I["Gold Layer"]
    I --> J["Dashboard BI"]
    I --> K["API Serving"]
    I --> L["ML Training"]
    E --> M["Alerta al Equipo"]
    M --> N["Correccion Manual"]
    N --> B
\`\`\`

### Descripción de Capas

- **Bronze**: Datos crudos sin transformar
- **Silver**: Datos limpiados y normalizados
- **Gold**: Datos agregados listos para consumo`,

  // 4. Code blocks (Python + SQL + YAML)
  `## Ejemplo de Consulta al Knowledge Base

Aquí tienes un ejemplo de cómo consultar el endpoint del agente:

\`\`\`python
import requests

endpoint = "https://adb-xxx.azuredatabricks.net/serving-endpoints/modelator-assistant/invocations"
headers = {
    "Authorization": "Bearer <tu-token>",
    "Content-Type": "application/json"
}

payload = {
    "input": [
        {"role": "user", "content": "¿Cuál es la política de retención de datos?"}
    ]
}

response = requests.post(endpoint, json=payload, headers=headers)
print(response.json())
\`\`\`

La consulta SQL equivalente para buscar en el índice:

\`\`\`sql
SELECT content, metadata, score
FROM vector_search(
    index => 'iacg_chatbot_poc_desa.sch_knowledge.knowledge_index',
    query => '¿Cuál es la política de retención de datos?',
    num_results => 5
)
WHERE score > 0.7
ORDER BY score DESC;
\`\`\`

La configuración del agente se define en:

\`\`\`yaml
llm:
  endpoint: databricks-meta-llama-3-3-70b-instruct

unity_catalog:
  catalog: iacg_chatbot_poc_desa
  schema: sch_knowledge

knowledge_assistant:
  endpoint_name: ka-ec90f025-endpoint
\`\`\``,

  // 5. Sequence diagram + text
  `## Flujo de Autenticación del Agente

El proceso de autenticación sigue el flujo OBO (On-Behalf-Of) cuando se ejecuta dentro de Databricks Apps:

\`\`\`mermaid
sequenceDiagram
    participant U as Usuario
    participant App as DatabricksApp
    participant Proxy as AuthProxy
    participant EP as ServingEndpoint
    participant Agent as ModelatorAgent

    U->>App: Envia pregunta
    App->>Proxy: Request con cookies
    Proxy->>Proxy: Valida sesion
    Proxy->>App: Token OBO
    App->>EP: POST invocations con Bearer
    EP->>Agent: Ejecuta agente
    Agent->>Agent: Busca en Knowledge Base
    Agent-->>EP: Respuesta
    EP-->>App: JSON Response
    App-->>U: Streaming Response
\`\`\`

### Métodos de Autenticación (por prioridad)

1. **OBO Token**: Usado automáticamente en Databricks Apps
2. **PAT (Personal Access Token)**: Para desarrollo local
3. **OAuth Client Credentials**: Fallback con service principal`,

  // 6. Mixed: table + code + list
  `## Endpoints Disponibles

### API del Agente

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| \`/serving-endpoints/{name}/invocations\` | POST | Invocar al agente |
| \`/api/2.0/serving-endpoints\` | GET | Listar endpoints |
| \`/api/2.0/serving-endpoints/{name}\` | GET | Detalle del endpoint |

### Formato de Request

\`\`\`python
# Formato estándar para MLflow pyfunc
payload = {
    "input": [
        {"role": "system", "content": "Eres un asistente..."},
        {"role": "user", "content": "Tu pregunta aquí"}
    ]
}
\`\`\`

### Formato de Response

La respuesta puede venir en diferentes formatos:

- **\`{content: "texto"}\`** — Respuesta directa
- **\`{predictions: ["texto"]}\`** — Formato predictions legacy
- **\`{output: [{content: "texto"}]}\`** — Formato MLflow 3.2+

> **Tip**: El agente siempre responde en español por defecto.`,

  // 7. Mermaid class diagram
  `## Estructura del Agente

El agente Modelator Assistant utiliza una arquitectura de supervisor con herramientas especializadas:

\`\`\`mermaid
graph LR
    subgraph Supervisor["Supervisor Agent"]
        LLM["LLaMA 3.3 70B"]
    end

    subgraph Tools["Herramientas"]
        KA["Knowledge Search"]
        GA["Genie Agent"]
    end

    subgraph Data["Fuentes de Datos"]
        VS[(Vector Search Index)]
        SQL[(SQL Warehouse)]
    end

    LLM --> KA
    LLM --> GA
    KA --> VS
    GA --> SQL
\`\`\`

### Componentes

1. **Supervisor**: Orquesta las herramientas según la pregunta del usuario
2. **Knowledge Search**: Busca en documentos indexados usando Vector Search
3. **Genie Agent**: Ejecuta consultas SQL para datos estructurados

El supervisor decide automáticamente qué herramienta usar basándose en el contexto de la pregunta.`,

  // 8. Star schema (erDiagram)
  `## Modelo de Datos Estrella — Ventas

El siguiente diagrama muestra el modelo dimensional tipo estrella para el dominio de ventas:

\`\`\`mermaid
erDiagram
    FACT_VENTAS ||--o{ DIM_PRODUCTO : productoId
    FACT_VENTAS ||--o{ DIM_CLIENTE : clienteId
    FACT_VENTAS ||--o{ DIM_TIEMPO : tiempoId
    FACT_VENTAS ||--o{ DIM_SUCURSAL : sucursalId
    FACT_VENTAS ||--o{ DIM_VENDEDOR : vendedorId

    FACT_VENTAS {
        bigint ventaId PK
        int productoId FK
        int clienteId FK
        int tiempoId FK
        int sucursalId FK
        int vendedorId FK
        decimal montoTotal
        int cantidad
        decimal descuento
        decimal impuesto
        string canalVenta
    }

    DIM_PRODUCTO {
        int productoId PK
        string nombre
        string categoria
        string subcategoria
        string marca
        decimal precioUnitario
        boolean activo
    }

    DIM_CLIENTE {
        int clienteId PK
        string nombreCompleto
        string segmento
        string region
        string tipoDocumento
        date fechaRegistro
    }

    DIM_TIEMPO {
        int tiempoId PK
        date fecha
        int anio
        int trimestre
        int mes
        string nombreMes
        int diaSemana
        boolean esFeriado
    }

    DIM_SUCURSAL {
        int sucursalId PK
        string nombre
        string ciudad
        string departamento
        string tipo
        string zona
    }

    DIM_VENDEDOR {
        int vendedorId PK
        string nombreCompleto
        string equipo
        string cargo
        date fechaIngreso
    }
\`\`\`

### Tabla de Hechos

| Tabla | Granularidad | Medidas |
|-------|-------------|---------|
| FACT_VENTAS | Una fila por transaccion | monto_total, cantidad, descuento, impuesto |

### Dimensiones

| Dimension | Cardinalidad Aprox. | Atributos Clave |
|-----------|---------------------|-----------------|
| DIM_PRODUCTO | ~5,000 | categoria, subcategoria, marca |
| DIM_CLIENTE | ~150,000 | segmento, region |
| DIM_TIEMPO | ~3,650 (10 anios) | anio, trimestre, mes, es_feriado |
| DIM_SUCURSAL | ~200 | ciudad, departamento, zona |
| DIM_VENDEDOR | ~500 | equipo, cargo |

### Consulta de Ejemplo

\`\`\`sql
SELECT
    t.anio,
    t.nombre_mes,
    p.categoria,
    s.ciudad,
    SUM(f.monto_total) AS venta_total,
    COUNT(DISTINCT f.cliente_id) AS clientes_unicos,
    AVG(f.descuento) AS descuento_promedio
FROM fact_ventas f
JOIN dim_tiempo t ON f.tiempo_id = t.tiempo_id
JOIN dim_producto p ON f.producto_id = p.producto_id
JOIN dim_sucursal s ON f.sucursal_id = s.sucursal_id
WHERE t.anio = 2025
GROUP BY t.anio, t.nombre_mes, p.categoria, s.ciudad
ORDER BY venta_total DESC
LIMIT 20;
\`\`\`

> **Nota**: Este modelo sigue la metodologia Kimball. La fact table usa surrogate keys para las dimensiones, permitiendo SCD (Slowly Changing Dimensions) en las tablas dimensionales.`,
];

let responseIndex = 0;

export function getMockResponse(): string {
  const response = MOCK_RESPONSES[responseIndex % MOCK_RESPONSES.length];
  responseIndex++;
  return response;
}

export function createMockStream(content: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunkSize = 15;

  return new ReadableStream({
    async start(controller) {
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.slice(i, i + chunkSize);
        // AI SDK Data Stream protocol: text part
        const data = `0:${JSON.stringify(chunk)}\n`;
        controller.enqueue(encoder.encode(data));
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      // Send finish message
      const finishData = `e:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0},"isContinued":false}\n`;
      controller.enqueue(encoder.encode(finishData));

      // Send done
      const doneData = `d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`;
      controller.enqueue(encoder.encode(doneData));

      controller.close();
    },
  });
}
