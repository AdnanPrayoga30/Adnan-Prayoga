// LiquidEther Fluid Dynamics Background Effect
class LiquidEtherBackground {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            colors: ['#5227FF', '#FF9FFC', '#B19EEF'],
            mouseForce: 20,
            cursorSize: 100,
            viscous: 30,
            resolution: 0.5,
            autoDemo: true,
            autoSpeed: 0.5,
            autoIntensity: 2.2,
            ...options
        };

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.particles = [];
        this.particleCount = 200;
        this.time = 0;
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        this.mouseVX = 0;
        this.mouseVY = 0;
        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
        
        this.setupCanvas();
        this.initParticles();
        this.setupEventListeners();
        this.animate();
    }

    setupCanvas() {
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        
        this.element.style.position = 'relative';
        this.element.style.overflow = 'hidden';
        this.element.insertBefore(this.canvas, this.element.firstChild);
        
        this.resize();
    }

    resize() {
        this.canvas.width = this.element.offsetWidth;
        this.canvas.height = this.element.offsetHeight;
    }

    initParticles() {
        this.particles = [];
        const colorCount = this.options.colors.length;
        
        for (let i = 0; i < this.particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 0.5 + 0.2;
            
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: Math.random() * 255,
                maxLife: 200 + Math.random() * 100,
                color: this.options.colors[i % colorCount],
                size: Math.random() * 2 + 1,
                rotation: Math.random() * Math.PI * 2,
                angularVelocity: (Math.random() - 0.5) * 0.1
            });
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        document.addEventListener('mousemove', (e) => {
            this.lastMouseX = this.mouseX;
            this.lastMouseY = this.mouseY;
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.mouseVX = this.mouseX - this.lastMouseX;
            this.mouseVY = this.mouseY - this.lastMouseY;
        });
    }

    updateParticles() {
        this.particles.forEach((p) => {
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            
            // Wrap around screen
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            
            // Mouse attraction
            const rect = this.element.getBoundingClientRect();
            const mouseLocalX = this.mouseX - rect.left;
            const mouseLocalY = this.mouseY - rect.top;
            
            const dx = mouseLocalX - p.x;
            const dy = mouseLocalY - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.options.cursorSize) {
                const force = (this.options.cursorSize - distance) / this.options.cursorSize;
                p.vx += (dx / distance) * force * this.options.mouseForce * 0.01;
                p.vy += (dy / distance) * force * this.options.mouseForce * 0.01;
            }
            
            // Damping
            p.vx *= 0.95;
            p.vy *= 0.95;
            
            // Speed limit
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (speed > 3) {
                p.vx = (p.vx / speed) * 3;
                p.vy = (p.vy / speed) * 3;
            }
            
            // Life cycle
            p.life = (p.life + 1) % p.maxLife;
            p.rotation += p.angularVelocity;
        });
    }

    drawParticles() {
        // Clear with fade trail
        this.ctx.fillStyle = 'rgba(10, 10, 21, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach((p) => {
            const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.8;
            const size = p.size * (1 + Math.sin(this.time * 0.05 + p.life) * 0.5);
            
            // Draw particle with glow
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 4);
            gradient.addColorStop(0, this.adjustColorAlpha(p.color, alpha * 0.8));
            gradient.addColorStop(0.5, this.adjustColorAlpha(p.color, alpha * 0.3));
            gradient.addColorStop(1, this.adjustColorAlpha(p.color, 0));
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, size * 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw core
            this.ctx.fillStyle = this.adjustColorAlpha(p.color, alpha);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw connection lines to nearby particles
            this.particles.forEach((p2) => {
                const dx = p2.x - p.x;
                const dy = p2.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 120) {
                    const lineAlpha = (1 - dist / 120) * alpha * 0.3;
                    this.ctx.strokeStyle = this.adjustColorAlpha(p.color, lineAlpha);
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            });
        });
    }

    adjustColorAlpha(color, alpha) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    animate() {
        this.time++;
        this.updateParticles();
        this.drawParticles();
        requestAnimationFrame(() => this.animate());
    }
}

// Animated Gradient Backgrounds for other sections
class AnimatedGradientBackground {
    constructor(element, colors = []) {
        this.element = element;
        this.colors = colors.length > 0 ? colors : ['#5227FF', '#FF9FFC', '#B19EEF'];
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.time = 0;
        
        this.setupCanvas();
        this.animate();
    }

    setupCanvas() {
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        
        this.element.style.position = 'relative';
        this.element.insertBefore(this.canvas, this.element.firstChild);
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = this.element.offsetWidth;
        this.canvas.height = this.element.offsetHeight;
    }

    animate() {
        this.time += 0.001;
        
        // Create animated gradient
        const x = Math.sin(this.time) * 100 + this.canvas.width / 2;
        const y = Math.cos(this.time * 0.7) * 100 + this.canvas.height / 2;
        
        const gradient = this.ctx.createRadialGradient(x, y, 0, this.canvas.width / 2, this.canvas.height / 2, 1000);
        
        gradient.addColorStop(0, this.colors[0]);
        gradient.addColorStop(0.5, this.colors[1 % this.colors.length]);
        gradient.addColorStop(1, this.colors[2 % this.colors.length]);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add noise overlay
        this.addNoiseOverlay();
        
        requestAnimationFrame(() => this.animate());
    }

    addNoiseOverlay() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = Math.random() * 20 - 10;
            data[i] += noise;     // R
            data[i + 1] += noise; // G
            data[i + 2] += noise; // B
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }
}

// Particle Swarm Background
class ParticleSwarmBackground {
    constructor(element, colors = []) {
        this.element = element;
        this.colors = colors.length > 0 ? colors : ['#5227FF', '#FF9FFC', '#B19EEF'];
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.time = 0;
        
        this.setupCanvas();
        this.initParticles();
        this.animate();
    }

    setupCanvas() {
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        
        this.element.style.position = 'relative';
        this.element.insertBefore(this.canvas, this.element.firstChild);
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = this.element.offsetWidth;
        this.canvas.height = this.element.offsetHeight;
    }

    initParticles() {
        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 2 + 1,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                life: Math.random() * 200
            });
        }
    }

    animate() {
        this.time++;
        
        // Clear with fade
        this.ctx.fillStyle = 'rgba(10, 10, 21, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            
            p.life = (p.life + 1) % 300;
            const alpha = Math.sin((p.life / 300) * Math.PI) * 0.6;
            
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
            gradient.addColorStop(0, this.adjustColorAlpha(p.color, alpha * 0.8));
            gradient.addColorStop(1, this.adjustColorAlpha(p.color, 0));
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        requestAnimationFrame(() => this.animate());
    }

    adjustColorAlpha(color, alpha) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

// Export for use
window.LiquidEtherBackground = LiquidEtherBackground;
window.AnimatedGradientBackground = AnimatedGradientBackground;
window.ParticleSwarmBackground = ParticleSwarmBackground;
