# ObraControl — Libro de marca (propuesta)

Propuesta para la comercialización. Nada de esto se aplicó a la aplicación: la interfaz conserva el diseño de la especificación. Las decisiones marcadas como **Por validar** requieren una verificación externa antes de invertir en ellas.

## 1. Esencia

| | |
|---|---|
| **Propósito** | Que quien construye sepa hoy, y no al cierre, si su obra gana o pierde dinero. |
| **Promesa** | La información de su obra, compartida y segura. |
| **Para quién** | Constructoras pequeñas y medianas de Costa Rica y Centroamérica (3 a 30 obras por año) que hoy controlan costos en Excel y coordinan por WhatsApp. |
| **Quién decide la compra** | Dueño o gerente general. |
| **Quién lo usa a diario** | Oficina (compras, contabilidad) y jefes de obra en campo. |
| **Contra qué compite** | Excel + WhatsApp, y ERPs de construcción que son caros y lentos de implementar. |

**Posicionamiento.** Para constructoras que ya no caben en una hoja de cálculo, ObraControl es el control de obra que avisa de un sobrecosto antes de que ocurra, porque une presupuesto, gastos, incidencias y subcontratos en un solo lugar que todo el equipo entiende.

### Pilares

1. **Claridad antes que cantidad.** Una pantalla responde una pregunta: ¿voy bien?
2. **Hecho para la obra.** Funciona en el teléfono, con una mano y con mala señal.
3. **Confianza.** Cada empresa ve solo lo suyo; cada cambio importante queda registrado.
4. **Modular.** Se paga y se aprende solo lo que se usa.

## 2. Nombre

**ObraControl**, una sola palabra, con O y C mayúsculas. Nunca "Obra Control", "OBRACONTROL" ni "Obracontrol" en texto corrido.

**Por validar:** disponibilidad en el Registro Nacional de Costa Rica (clases 9 y 42 de Niza) y dominios `obracontrol.cr`, `obracontrol.com`, `obracontrol.app`. El nombre es descriptivo, lo que ayuda a entenderlo y dificulta registrarlo; si el registro lo objeta, la alternativa es registrarlo como marca mixta (nombre + isotipo).

## 3. Logotipo

Archivos en [`logos/`](logos/).

| Versión | Archivo | Uso |
|---|---|---|
| Horizontal sobre claro | `obracontrol-horizontal-claro.svg` | Web, documentos, facturas |
| Horizontal sobre oscuro | `obracontrol-horizontal-oscuro.svg` | Pantalla de inicio, presentaciones, rotulación |
| Isotipo | `obracontrol-isotipo.svg` | Ícono de app, favicon, avatar de redes |

**Concepto.** El isotipo conserva la forma del logo actual: un techo a dos aguas que también se lee como una flecha hacia arriba y como la "A" de obr**a**. El bloque inferior es la puerta: la obra ya habitada, el resultado. Se mantiene la silueta para no perder lo ya reconocido; cambia el color, de turquesa a naranja, para que el logo y la aplicación hablen el mismo idioma.

**Reglas.**
- Área de respeto: la altura de la puerta del isotipo en los cuatro lados.
- Tamaño mínimo: 24 px de alto en pantalla, 8 mm en impresos. Por debajo de eso, solo isotipo.
- No deformar, rotar, cambiar colores, agregar sombras ni colocarlo sobre fotografías sin un fondo sólido.

## 4. Color

La aplicación ya usa naranja como color primario; el inicio de sesión y la pantalla de bienvenida usan turquesa. La especificación lo señala como inconsistencia. La propuesta es unificar en naranja y dejar el turquesa como color de apoyo.

| Nombre | Hex | Uso | Contraste |
|---|---|---|---|
| **Naranja Obra** | `#F4602A` | Acción principal, isotipo, acentos | Con texto blanco: 3.3:1. Solo para texto grande o botones con texto en negrita ≥ 14 px |
| Naranja Obra oscuro | `#C2410C` | Texto naranja sobre fondo claro, estado hover | 5.2:1 sobre blanco |
| **Azul Plano** | `#1F2A3A` | Texto, barra lateral, fondos oscuros | 14.6:1 sobre blanco |
| **Cal** | `#F8F6F1` | Fondo general | — |
| Concreto | `#6B7280` | Texto secundario | 4.8:1 sobre blanco |
| Línea | `#D5D8DD` | Bordes y divisiones | — |
| Turquesa Nivel | `#0F766E` | Apoyo: enlaces, ilustraciones | 5.5:1 sobre blanco |
| Éxito | `#15803D` | Al día, resuelto | 5.0:1 |
| Alerta | `#B45309` | Cerca del presupuesto | 5.0:1 |
| Riesgo | `#B91C1C` | Sobregiro, prioridad alta | 6.5:1 |

Las razones de contraste son aproximadas y deben comprobarse con una herramienta antes de publicar. Un estado nunca se comunica solo con color: siempre lleva texto o ícono.

## 5. Tipografía

| Rol | Fuente | Pesos | Dónde |
|---|---|---|---|
| Títulos y texto | Plus Jakarta Sans | 400, 500, 600, 700, 800 | Todo |
| Cifras | Space Mono | 400, 700 | Montos en colones, porcentajes, códigos de partida |

Son las fuentes que ya usa la aplicación, ambas gratuitas (SIL Open Font License). Los montos en fuente monoespaciada son un rasgo de marca: se alinean en columnas y se leen como un presupuesto.

## 6. Voz

Hablamos como un ingeniero residente con experiencia: directo, tranquilo, sin adornos.

| Somos | No somos |
|---|---|
| Claros | Técnicos por presumir |
| Tranquilos ante el problema | Alarmistas |
| Respetuosos (usted en ventas, tú en la app) | Confianzudos |
| Concretos: cifras y fechas | Vagos: "optimiza tu gestión" |

**Mensajes de error.** Decimos qué pasó, que la información está a salvo y qué hacer ahora. Nunca culpamos a la persona ni mostramos códigos técnicos.

| En vez de | Decimos |
|---|---|
| Error 403: Forbidden | No tienes permiso para esta acción. Pídele al dueño de la empresa que ajuste tu rol. |
| Request failed | No pudimos comunicarnos con ObraControl. Revisa tu conexión; lo que escribiste sigue aquí. |
| Invalid input | Revisa los datos: el monto debe ser mayor que cero. |

**Vocabulario.** Obra (no "proyecto"), partida o línea de presupuesto, gasto, comprometido, sobregiro, incidencia, subcontratista, avance. Moneda: `₡1.500.000`, sin decimales.

## 7. Mensajes comerciales

- **Titular:** Sepa hoy si su obra gana o pierde.
- **Apoyo:** Presupuesto, gastos, incidencias y subcontratos en un solo lugar. Sin hojas de cálculo que nadie actualiza.
- **Prueba:** Alertas de sobrecosto por partida, antes de que el gasto ocurra.
- **Llamado:** Pruébelo con una obra real durante 30 días.

## 8. Imagen y fotografía

- Obras reales de la región, con luz natural, gente trabajando con equipo de protección. Nada de banco de imágenes con cascos relucientes.
- Capturas de la aplicación con datos verosímiles en colones.
- Íconos de línea (Lucide), trazo de 2 px, sin relleno.

## 9. Propuesta comercial inicial (hipótesis)

Los precios son un punto de partida para validar con clientes piloto, no una recomendación basada en datos de mercado.

| Plan | Incluye | Precio mensual (hipótesis) |
|---|---|---|
| **Base** | Rentabilidad: obras, presupuesto, gastos, alertas. Hasta 3 obras activas, 5 usuarios | USD 49 |
| **Equipo** | Base + Comunicaciones (incidencias y evidencias). Hasta 10 obras, 15 usuarios | USD 129 |
| **Empresa** | Equipo + Subcontratistas (contratos y pagos), auditoría, soporte prioritario. Obras y usuarios sin límite | USD 299 |

Cobrar por obra activa, no por usuario, anima a sumar a todo el equipo de campo, que es donde nace la información.

## 10. Aplicaciones prioritarias

1. Unificar el color de la pantalla de bienvenida y el inicio de sesión (requiere aprobar este libro, porque cambia la interfaz especificada).
2. Favicon e ícono de app con el isotipo.
3. Sitio de una página con titular, tres beneficios, captura y formulario de demostración.
4. Plantilla de propuesta comercial y firma de correo.
5. Perfil de LinkedIn y WhatsApp Business.
