// modal de loading -- Samuel Campovilla


(function setupLoaderBox() {
    if (window.__loadInit) {
        return;
    }
    window.__loadInit = true;

    const overlay = document.createElement('div');
    overlay.id = 'load_box';
    overlay.innerHTML = `
        <div class="load_card" role="status" aria-live="polite">
            <div class="load_spin" aria-hidden="true"></div>
            <p class="load_txt">Carregando...</p>
        </div>
    `;

    const mountOverlay = () => {
        if (!document.body.contains(overlay)) {
            document.body.appendChild(overlay);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountOverlay);
    } else {
        mountOverlay();
    }

    let reqCount = 0;

    const toggleOverlay = () => {
        overlay.classList.toggle('visible', reqCount > 0);
    };

    const addReq = () => {
        reqCount += 1;
        mountOverlay();
        toggleOverlay();
    };

    const endReq = () => {
        reqCount = Math.max(0, reqCount - 1);
        toggleOverlay();
    };

    const oldFetch = window.fetch ? window.fetch.bind(window) : null;

    if (oldFetch) {
        window.fetch = async(...args) => {
            addReq();
            try {
                return await oldFetch(...args);
            } finally {
                endReq();
            }
        };
    }

})();