
class ScrollyBlock {
    static get toolbox() {
        return {
            title: 'Scrolly Section',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 3V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        };
    }

    constructor({ data }) {
        this.data = data.backgrounds ? data : {
            backgrounds: [],
            steps: []
        };
        this.wrapper = undefined;
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.classList.add('scrolly-editor-wrapper', 'border', 'border-gray-200', 'rounded-lg', 'p-4', 'my-4', 'bg-white');

        // Container grid
        const container = document.createElement('div');
        container.classList.add('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-6');

        // LEFT: Backgrounds Manager
        const bgContainer = document.createElement('div');
        bgContainer.classList.add('space-y-4', 'border-r', 'border-gray-100', 'pr-4');

        const bgTitle = document.createElement('h4');
        bgTitle.textContent = '1. Backgrounds (Ảnh/Video)';
        bgTitle.classList.add('font-bold', 'text-gray-700', 'mb-2', 'text-sm', 'uppercase');
        bgContainer.appendChild(bgTitle);

        this.bgList = document.createElement('div');
        this.bgList.classList.add('space-y-3');
        this._renderBgList();
        bgContainer.appendChild(this.bgList);

        const addBgBtn = document.createElement('button');
        addBgBtn.type = 'button';
        addBgBtn.textContent = '+ Add Background';
        addBgBtn.classList.add('mt-2', 'px-3', 'py-1.5', 'text-xs', 'font-medium', 'text-blue-600', 'bg-blue-50', 'rounded', 'hover:bg-blue-100', 'transition-colors');
        addBgBtn.onclick = () => this._addBackground();
        bgContainer.appendChild(addBgBtn);

        container.appendChild(bgContainer);

        // RIGHT: Steps Manager
        const stepsContainer = document.createElement('div');
        stepsContainer.classList.add('space-y-4');

        const stepsTitle = document.createElement('h4');
        stepsTitle.textContent = '2. Steps (Nội dung trượt)';
        stepsTitle.classList.add('font-bold', 'text-gray-700', 'mb-2', 'text-sm', 'uppercase');
        stepsContainer.appendChild(stepsTitle);

        this.stepsList = document.createElement('div');
        this.stepsList.classList.add('space-y-4');
        this._renderStepsList();
        stepsContainer.appendChild(this.stepsList);

        const addStepBtn = document.createElement('button');
        addStepBtn.type = 'button';
        addStepBtn.textContent = '+ Add Step';
        addStepBtn.classList.add('mt-2', 'px-3', 'py-1.5', 'text-xs', 'font-medium', 'text-green-600', 'bg-green-50', 'rounded', 'hover:bg-green-100', 'transition-colors');
        addStepBtn.onclick = () => this._addStep();
        stepsContainer.appendChild(addStepBtn);

        container.appendChild(stepsContainer);
        this.wrapper.appendChild(container);

        return this.wrapper;
    }

    // --- Background Methods ---
    _renderBgList() {
        this.bgList.innerHTML = '';
        this.data.backgrounds.forEach((bg, index) => {
            const item = document.createElement('div');
            item.classList.add('flex', 'items-center', 'gap-2', 'bg-gray-50', 'p-2', 'rounded', 'text-sm');

            // ID Display
            const idLabel = document.createElement('span');
            idLabel.textContent = bg.id;
            idLabel.classList.add('font-mono', 'text-xs', 'bg-gray-200', 'px-1.5', 'py-0.5', 'rounded', 'text-gray-600');

            // Url Input
            const urlInput = document.createElement('input');
            urlInput.type = 'text';
            urlInput.placeholder = 'Image URL...';
            urlInput.value = bg.src;
            urlInput.classList.add('flex-1', 'bg-white', 'border', 'border-gray-200', 'rounded', 'px-2', 'py-1', 'focus:outline-none', 'focus:border-blue-400', 'text-xs');
            urlInput.onchange = (e) => {
                this.data.backgrounds[index].src = e.target.value;
            };

            // Type select (simple toggle for now, or detect)
            // Delete btn
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.innerHTML = '&times;';
            delBtn.classList.add('text-red-500', 'hover:text-red-700', 'px-2', 'font-bold');
            delBtn.onclick = () => {
                this.data.backgrounds.splice(index, 1);
                this._renderBgList();
                this._renderStepsList(); // Re-render steps to update dropdowns
            };

            item.appendChild(idLabel);
            item.appendChild(urlInput);
            item.appendChild(delBtn);
            this.bgList.appendChild(item);
        });
    }

    _addBackground() {
        const newId = `bg-${this.data.backgrounds.length + 1}`;
        this.data.backgrounds.push({
            id: newId,
            src: '',
            type: 'image'
        });
        this._renderBgList();
        this._renderStepsList();
    }

    // --- Step Methods ---
    _renderStepsList() {
        this.stepsList.innerHTML = '';
        this.data.steps.forEach((step, index) => {
            const item = document.createElement('div');
            item.classList.add('border', 'border-gray-200', 'rounded', 'p-3', 'bg-white', 'shadow-sm', 'space-y-2');

            // Header
            const header = document.createElement('div');
            header.classList.add('flex', 'justify-between', 'items-center', 'mb-1');
            const title = document.createElement('span');
            title.textContent = `Step ${index + 1}`;
            title.classList.add('font-bold', 'text-xs', 'text-gray-500');

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.textContent = 'Delete';
            delBtn.classList.add('text-xs', 'text-red-500', 'hover:text-red-700');
            delBtn.onclick = () => {
                this.data.steps.splice(index, 1);
                this._renderStepsList();
            };
            header.appendChild(title);
            header.appendChild(delBtn);
            item.appendChild(header);

            // Content Textarea
            const textarea = document.createElement('textarea');
            textarea.placeholder = 'Step content...';
            textarea.value = step.text;
            textarea.classList.add('w-full', 'border', 'border-gray-200', 'rounded', 'p-2', 'text-sm', 'focus:ring-1', 'focus:ring-blue-200', 'focus:outline-none');
            textarea.rows = 2;
            textarea.onchange = (e) => {
                this.data.steps[index].text = e.target.value;
            };
            item.appendChild(textarea);

            // Controls Row
            const controls = document.createElement('div');
            controls.classList.add('flex', 'gap-2');

            // Trigger ID Select
            const selectBg = document.createElement('select');
            selectBg.classList.add('flex-1', 'text-xs', 'border', 'border-gray-200', 'rounded', 'p-1');
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '-- Select Background --';
            selectBg.appendChild(defaultOption);

            this.data.backgrounds.forEach(bg => {
                const option = document.createElement('option');
                option.value = bg.id;
                option.textContent = bg.id;
                option.selected = bg.id === step.triggerId;
                selectBg.appendChild(option);
            });
            selectBg.onchange = (e) => {
                this.data.steps[index].triggerId = e.target.value;
            };
            controls.appendChild(selectBg);

            // Position Select
            const selectPos = document.createElement('select');
            selectPos.classList.add('w-24', 'text-xs', 'border', 'border-gray-200', 'rounded', 'p-1');
            ['center', 'left', 'right'].forEach(pos => {
                const option = document.createElement('option');
                option.value = pos;
                option.textContent = pos.charAt(0).toUpperCase() + pos.slice(1);
                option.selected = pos === step.position;
                selectPos.appendChild(option);
            });
            selectPos.onchange = (e) => {
                this.data.steps[index].position = e.target.value;
            };
            controls.appendChild(selectPos);

            item.appendChild(controls);
            this.stepsList.appendChild(item);
        });
    }

    _addStep() {
        this.data.steps.push({
            text: '',
            triggerId: '',
            position: 'center'
        });
        this._renderStepsList();
    }

    save(blockContent) {
        return this.data;
    }
}

export default ScrollyBlock;
