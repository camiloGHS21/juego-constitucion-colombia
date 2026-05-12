import { ARTICLES } from '../data/Articles';

export default class ConstitutionalLexicon {
    constructor(scene) {
        this.scene = scene;
        this.modal = null;
        this.overlay = null;
    }

    show(highlightArticle = null) {
        if (this.modal) return;

        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'article-modal-overlay';
        
        // Create modal content
        this.overlay.innerHTML = `
            <div class="article-modal-content">
                <div class="library-header">
                    <h2 class="library-title">LÉXICO CONSTITUCIONAL</h2>
                    <div class="library-search-container">
                        <span class="search-icon">🔍</span>
                        <input type="text" class="library-search" placeholder="Buscar por artículo o palabra clave..." id="lexicon-search">
                    </div>
                    <button class="article-modal-close" id="lexicon-close">×</button>
                </div>
                <div class="library-body" id="lexicon-body">
                    ${this.generateArticleList()}
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        // Event Listeners
        const closeBtn = document.getElementById('lexicon-close');
        closeBtn.onclick = () => this.hide();

        const searchInput = document.getElementById('lexicon-search');
        searchInput.oninput = (e) => this.filterArticles(e.target.value);

        // Close on overlay click
        this.overlay.onclick = (e) => {
            if (e.target === this.overlay) this.hide();
        };

        // Auto-scroll to highlighted article
        if (highlightArticle) {
            setTimeout(() => {
                const element = document.getElementById(`art-${highlightArticle}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('highlighted');
                }
            }, 100);
        }

        // Focus search
        searchInput.focus();
    }

    generateArticleList(filter = '') {
        let html = '';
        const sections = {
            'TÍTULO IX: ELECCIONES': [258, 259, 260, 261, 262, 263, 264, 265, 266],
            'TÍTULO X: ORGANISMOS DE CONTROL': [267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284],
            'TÍTULO XI: ORGANIZACIÓN TERRITORIAL': [285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331]
        };

        for (const [title, ids] of Object.entries(sections)) {
            const filteredIds = ids.filter(id => {
                const content = ARTICLES[id].toLowerCase();
                const search = filter.toLowerCase();
                return content.includes(search) || id.toString().includes(search);
            });

            if (filteredIds.length > 0) {
                html += `<div class="library-section">
                    <h3 class="library-section-title">${title}</h3>
                    ${filteredIds.map(id => `
                        <div class="library-article" id="art-${id}">
                            <h3>Artículo ${id}</h3>
                            <p>${ARTICLES[id]}</p>
                        </div>
                    `).join('')}
                </div>`;
            }
        }

        if (html === '') {
            html = '<div class="no-results">No se encontraron artículos que coincidan con tu búsqueda.</div>';
        }

        return html;
    }

    filterArticles(query) {
        const body = document.getElementById('lexicon-body');
        if (body) {
            body.innerHTML = this.generateArticleList(query);
        }
    }

    hide() {
        if (this.overlay) {
            this.overlay.style.opacity = '0';
            this.overlay.style.pointerEvents = 'none';
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                }
                this.overlay = null;
                this.modal = null;
            }, 300);
        }
    }
}
