# 00 · Visión de Producto y Límites

## El problema real

Hoy los clientes de la agencia operan sobre cuatro superficies desconectadas:

| Superficie | Qué vive ahí hoy | Dolor |
|---|---|---|
| Notion | Tableros de producción de creativos, seguimiento de guiones | Manual, sin métricas, sin vínculo con ingresos |
| Google Sheets | Datos de clientes, correos de onboarding | Sin validación, sin historial, errores de copiar y pegar |
| GoHighLevel | CRM, pipeline, contactos | Genérico, no modelado para un funnel liderado por contenido |
| Metricool | Programación y métricas por publicación | Las métricas terminan en "views"; nunca llegan al ingreso |
| ManyChat | Automatización comentario → DM en Instagram | El punto de entrada del lead es invisible para todo lo que viene después |

El cliente tiene que entrar a cinco herramientas para responder una pregunta, y **ninguna
puede responder la pregunta que de verdad importa**: *¿qué pieza de contenido produjo qué
venta?*

## Qué estamos construyendo

Una **capa central de información**. El dashboard es dueño del modelo de datos; las
plataformas externas son entradas y salidas alrededor de él.

```
                         ┌──────────────────────┐
                         │   CRM POTENCIADO     │
                         │  (dueño de los datos)│
                         └──────────┬───────────┘
                                    │
        ┌──────────────┬────────────┼────────────┬──────────────┐
        ▼              ▼            ▼            ▼              ▼
    CONTENIDO         CRM        ANALÍTICA    HABILITACIÓN   ASISTENTE
        │              │            │            │              │
   Metricool ○     ManyChat ○    APIs Ads ○   (propio)      Hermes ○
   (fuente)        (fuente)      (fuente)                  (consumidor)
```

`○` = sistema externo. Todo lo que no está marcado es nuestro.

## No-objetivos explícitos

Declararlos ahora previene que el alcance se desborde durante la construcción.

| Lo que NO construimos | Por qué | Qué hacemos en su lugar |
|---|---|---|
| Un programador de redes sociales | Metricool ya lo hace y lo hace bien | Guardamos el registro de publicación + el link; opcionalmente sincronizamos desde Metricool |
| Un bot de DMs de Instagram | La automatización comentario→DM de ManyChat es madura y barata | Ingerimos eventos de ManyChat por webhook |
| Un editor de video o gestor de assets | No es el cuello de botella | Guardamos URLs a Drive/Frame.io |
| Una plataforma de email marketing | Fuera del alcance del funnel descrito | Solo correo transaccional (Resend) |
| Un SaaS público multi-tenant con registro autoservicio y facturación | El cliente dijo explícitamente "todavía no un SaaS comercial" | El admin provisiona cuentas manualmente; **el modelo de datos es multi-tenant desde el día uno** para que esto siga siendo posible |
| Un constructor de CRM no-code genérico | Configurable ≠ esquemas arbitrarios definidos por el usuario | Los pipelines y tipos de funnel son *datos* configurables, no tablas definidas por el usuario |

## Las tres preguntas que el producto debe responder

Cada funcionalidad se justifica con una de estas. Si una funcionalidad propuesta no sirve a
ninguna, no entra en las fases 1 a 4.

1. **Atribución** — ¿Qué hook / ángulo / lead magnet produce leads, llamadas e ingresos?
2. **Operación** — ¿Qué tiene que hacer hoy cada persona del equipo, y lo hizo?
3. **Diagnóstico** — ¿Dónde se está fugando el funnel, y qué activo (SOP, entrenamiento) lo arregla?

## Usuarios principales

| Usuario | Realidad | Qué necesita del producto |
|---|---|---|
| **Admin de la agencia** (Yamil + equipo) | Opera varias cuentas de clientes | Vista transversal, autoría de estrategia, biblioteca de SOPs, provisión de cuentas |
| **Dueño del cliente** | Empresario que compró el servicio | Una sola vista de su negocio; no quiere aprender cinco herramientas |
| **Editor del cliente** | Produce el contenido | Una cola de guiones para grabar/editar con estado claro |
| **Setter del cliente** | Trabaja leads entrantes | Una lista de trabajo con contexto completo de cada contacto |
| **Closer del cliente** | Corre las llamadas de venta | Las llamadas de hoy con contexto de preparación; registra resultados y objeciones |

## Criterios de éxito del MVP

No es "las 28 secciones están construidas". El MVP es exitoso cuando:

- Un cliente entra **una vez al día en lugar de abrir Notion + Sheets + GHL**.
- Cada lead en el sistema tiene un origen rastreable hasta una publicación específica.
- La agencia puede producir el reporte mensual de un cliente **sin tocar una hoja de cálculo**.
- Dar de alta una cuenta nueva toma menos de 30 minutos de trabajo administrativo.
