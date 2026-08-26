# README-INSTALACION.md

# 🎮 Conquista del Calabozo - GUÍA DE INSTALACIÓN

## Para personas sin experiencia en programación

### ✅ Requisitos (Solo necesitas instalar una vez)

1. **Node.js** (incluye npm automáticamente)
   - Descarga desde: https://nodejs.org/ (versión LTS)
   - Instálalo como cualquier otro programa
   - Verifica que funcione: abre Terminal/CMD y escribe:
     ```bash
     node --version
     npm --version
     ```

### 🚀 Instalación Paso a Paso

#### 1. Descarga el proyecto
```bash
# Opción A: Desde GitHub (si tienes git instalado)
git clone https://github.com/VJMaya/conquista-calabozo.git
cd conquista-calabozo

# Opción B: Descarga como ZIP desde GitHub
# - Ve a: https://github.com/VJMaya/conquista-calabozo
# - Click en "Code" → "Download ZIP"
# - Descomprime la carpeta
# - Abre Terminal/CMD en esa carpeta
```

#### 2. Instala las dependencias
```bash
npm install
```
*(Esto descarga todo lo necesario - puede tomar 2-3 minutos)*

#### 3. ¡Inicia el servidor!
```bash
npm run dev
```

**Verás esto en la pantalla:**
```
🎮 ===================================
✅ Servidor iniciado en http://localhost:3000

📱 Comparte este enlace con otros jugadores:
   http://localhost:3000

🎮 ===================================
```

### 👥 ¿Cómo conectan otros jugadores?

#### Opción 1: En tu misma red (WiFi de casa)
```
1. Abre Terminal en tu computadora y escribe:
   ipconfig (Windows) o ifconfig (Mac/Linux)

2. Busca algo como "192.168.1.XXX" o "10.0.0.XXX"

3. Comparte este enlace con otros jugadores:
   http://192.168.1.XXX:3000
   (reemplaza XXX con tus números)

4. Otros jugadores abren el enlace en su navegador
```

#### Opción 2: Desde internet (si tienes router con puerto abierto)
```
1. Configura tu router para abrir el puerto 3000
   (búsca "port forwarding" en tu router)

2. Obtén tu IP pública desde: https://www.miip.com

3. Comparte: http://TU_IP_PUBLICA:3000
```

#### Opción 3: Usar Ngrok (más fácil para internet)
```bash
# 1. Descarga Ngrok: https://ngrok.com/download
# 2. Descomprime y coloca en carpeta conocida
# 3. Abre Terminal en esa carpeta
# 4. Ejecuta:
   ./ngrok http 3000
   
# 5. Ngrok te dará un enlace como:
   https://abc123.ngrok.io
   
# 6. Comparte ese enlace con otros jugadores
```

### 🎮 Cómo Jugar

#### Host (tu computadora)
1. Abre http://localhost:3000
2. Elige tu nombre y clase
3. Espera a que se conecten otros jugadores
4. Cuando tengas 2+ jugadores, ve a la consola y presiona Enter
5. El juego comienza automáticamente

#### Otros Jugadores
1. Abren el enlace que compartiste
2. Eligen nombre y clase
3. Ven a otros jugadores conectados
4. Esperan que el host inicie el juego
5. ¡A jugar!

### ⚙️ Archivos importantes

```
conquista-calabozo/
├── server.js                 ← El servidor (NO modificar)
├── app/                      ← Páginas del juego
├── components/               ← Componentes visuales
├── lib/                      ← Lógica del juego
├── package.json              ← Dependencias
└── README.md                 ← Este archivo
```

### ❓ Preguntas Frecuentes

**P: ¿Puedo cerrar Terminal una vez iniciado el servidor?**
R: No, Terminal debe estar abierta mientras juegas. Si la cierras, el juego se detiene.

**P: ¿Qué significa ese error al iniciar?**
R: Si ves error de puerto, cierra Terminal, abre una nueva y ejecuta nuevamente.

**P: ¿Cómo dejo de jugar?**
R: Presiona Ctrl+C en Terminal para detener el servidor.

**P: ¿Puedo modificar las preguntas?**
R: Sí, están en `lib/questions.js` - edita con cualquier editor de texto.

**P: ¿Funciona en teléfono?**
R: Sí, si usas la IP local (192.168.x.x) desde el mismo WiFi.

### 🆘 Problemas Comunes

**Error: "Port 3000 is already in use"**
```bash
# Solución: Usa otro puerto
PORT=3001 npm run dev
# Accede a: http://localhost:3001
```

**Error: "Cannot find module"**
```bash
# Solución: Reinstala dependencias
rm -rf node_modules
npm install
npm run dev
```

**No se ve el juego en el navegador**
```bash
# Solución: Asegúrate que está corriendo
# Terminal debe mostrar: "✅ Servidor iniciado"
# Luego abre: http://localhost:3000
```

### 📚 Recursos Útiles

- Node.js: https://nodejs.org/
- Ngrok: https://ngrok.com/
- Mi IP: https://www.miip.com/
- GitHub: https://github.com/VJMaya/conquista-calabozo

### 💬 ¿Necesitas ayuda?

Email: coctok@hotmail.com
GitHub: @VJMaya

¡Bienvenido a Conquista del Calabozo! 🏰⚔️
