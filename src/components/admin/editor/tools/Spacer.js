class Spacer {
    static get toolbox() {
        return {
            title: 'Khoảng cách (Spacer)',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v18M16 3v18M3 8h18M3 16h18"/></svg>'
        };
    }

    constructor({ data }) {
        this.data = data || {};
        this.height = this.data.height || 32; // Default height 32px
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.classList.add('ce-spacer');
        this.wrapper.style.height = `${this.height}px`;
        this.wrapper.style.backgroundColor = '#f9fafb';
        this.wrapper.style.border = '1px dashed #e5e7eb';
        this.wrapper.style.display = 'flex';
        this.wrapper.style.alignItems = 'center';
        this.wrapper.style.justifyContent = 'center';
        this.wrapper.style.color = '#9ca3af';
        this.wrapper.style.fontSize = '12px';
        this.wrapper.innerHTML = 'Khoảng trống (Spacer)';

        // Allow clicking to simple toggle or resize (optional, keep simple for now)
        return this.wrapper;
    }

    save() {
        return {
            height: this.height
        };
    }
}

export default Spacer;
