// 产品选购页面JavaScript功能
class ProductSelector {
    constructor() {
        this.apiUrl = 'https://app1.xuanyiy.cn/v1/products';
        this.data = null;
        this.currentFirstGroup = null;
        this.currentSecondGroup = null;
        this.bindProductTypeCardEvents();
        
        this.init();
    }

    bindProductTypeCardEvents() {
        const container = document.getElementById('productTypeCards');
        if (!container) return;
        
        container.addEventListener('click', e => {
            const card = e.target.closest('.product-type-card');
            if (card && this.data?.first_group) {
                const index = [...container.children].indexOf(card);
                this.selectFirstGroup(this.data.first_group[index], card);
            }
        });
    }


    async init() {
        try {
            this.showLoading();
            await this.fetchData();
            this.renderProductTypes();
            this.bindRegionDrawerEvents();
            this.hideLoading();
        } catch (error) {
            console.error('初始化失败:', error);
            this.hideLoading();
            this.showError('加载产品数据失败，请刷新页面重试');
        }
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4757;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 500;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    async fetchData() {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.status !== 200) {
                throw new Error(result.msg || 'API返回错误');
            }

            this.data = result.data;
            console.log('API数据加载成功:', this.data);
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    renderProductTypes() {
        const container = document.getElementById('productTypeCards');
        container.innerHTML = '';

        if (!this.data || !this.data.first_group) {
            container.innerHTML = '<p>暂无产品类型</p>';
            return;
        }

        this.data.first_group.forEach((group, index) => {
            const [name, tagline] = this.parseGroupName(group.name);
            
            const card = document.createElement('div');
            card.className = 'product-type-card';
            if (index === 0) {
                card.classList.add('active');
                this.currentFirstGroup = group;
            }
            
            card.innerHTML = `
                <h3>${name}</h3>
                <p>${tagline}</p>
            `;
            
            card.addEventListener('click', () => {
                this.selectFirstGroup(group, card);
            });
            
            container.appendChild(card);
        });

        // 默认选择第一个分组
        if (this.data.first_group.length > 0) {
            this.selectFirstGroup(this.data.first_group[0]);
        }
    }

    parseGroupName(nameString) {
        const parts = nameString.split(',');
        return [parts[0] || '', parts[1] || ''];
    }

    getCountryFlag(countryCode) {
        if (!/^[A-Za-z]{2}$/.test(countryCode)) return { emoji: '', svg: '' };

        const upper = countryCode.toUpperCase();
        const codePoints = [...upper].map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
        const emoji = String.fromCodePoint(...codePoints);
        const hex = codePoints.map(cp => cp.toString(16)).join('-');
        const svg = `https://cdn.bootcdn.net/ajax/libs/twemoji/15.1.0/svg/${hex}.svg`;

        return { emoji, svg };
    }

    parseSecondGroupName(nameString) {
        const parts = nameString.split(',');
        let name = parts[0] || '';
        let tagline = parts[1] || '';
        let emoji = parts[2] || '';
        let flagIcon = '';

        if (name.includes('^')) {
            const [countryCode, ...nameParts] = name.split('^');
            name = nameParts.join('^');
            const flagData = this.getCountryFlag(countryCode.trim());
            flagIcon = flagData.svg;
        } else if (name.includes('|')) {
            const [emojiCode, ...nameParts] = name.split('|');
            name = nameParts.join('|');
            flagIcon = `https://cdn.bootcdn.net/ajax/libs/twemoji/15.1.0/svg/${emojiCode.trim()}.svg`;
        }

        if (!flagIcon) {
            flagIcon = 'https://cdn.bootcdn.net/ajax/libs/twemoji/15.1.0/svg/1f30d.svg';
        }

        return { name, tagline, emoji, flagIcon };
    }


    selectFirstGroup(group, clickedCard = null) {
        // 更新当前选择的一级分组
        this.currentFirstGroup = group;
        
        // 更新卡片状态
        document.querySelectorAll('.product-type-card').forEach(card => {
            card.classList.remove('active');
        });
        
        if (clickedCard) {
            clickedCard.classList.add('active');
        } else {
            document.querySelector('.product-type-card').classList.add('active');
        }

        // 渲染二级分组
        this.renderRegions();
        
        // 默认选择第一个二级分组
        if (group.group && group.group.length > 0) {
            this.selectSecondGroup(group.group[0]);
        }
    }

    renderRegions() {
        const container = document.getElementById('regionList');
        const drawerList = document.getElementById('regionDrawerList');
        container.innerHTML = '';
        if (drawerList) drawerList.innerHTML = '';

        if (!this.currentFirstGroup || !this.currentFirstGroup.group) {
            container.innerHTML = '<p>暂无可用区域</p>';
            return;
        }

        this.currentFirstGroup.group.forEach((region, index) => {
            const regionInfo = this.parseSecondGroupName(region.name);
            
            const item = document.createElement('div');
            item.className = 'region-item';
            if (index === 0) {
                item.classList.add('active');
            }
            
            // 构建图标与文本两列布局，保证标题与简介左缘对齐
            const iconCol = `<div class="region-icon"><img src="${regionInfo.flagIcon}" alt="国旗" class="region-flag-icon" /></div>`;

            item.innerHTML = `
                <div class="region-info">
                    ${iconCol}
                    <div class="region-text">
                        <h4>${regionInfo.name}</h4>
                        <p>${regionInfo.tagline}</p>
                    </div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.selectSecondGroup(region, item);
            });
            
            container.appendChild(item);

            // 抽屉中的同款项
            if (drawerList) {
                const dItem = item.cloneNode(true);
                dItem.classList.remove('active');
                dItem.addEventListener('click', () => {
                    this.selectSecondGroup(region);
                    this.closeRegionDrawer();
                });
                drawerList.appendChild(dItem);
            }
        });
    }


    selectSecondGroup(group, clickedItem = null) {
        this.currentSecondGroup = group;
        
        // 更新区域选择状态
        document.querySelectorAll('.region-item').forEach(item => {
            item.classList.remove('active');
        });
        
        if (clickedItem) {
            clickedItem.classList.add('active');
        } else {
            document.querySelector('.region-item').classList.add('active');
        }

        // 更新产品详情区域
        this.renderProductDetails();
    }

    bindRegionDrawerEvents() {
        const openBtn = document.getElementById('openRegionDrawerBtn');
        const closeBtn = document.getElementById('closeRegionDrawerBtn');
        const overlay = document.getElementById('regionDrawerOverlay');

        if (openBtn) {
            openBtn.addEventListener('click', () => this.openRegionDrawer());
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeRegionDrawer());
        }
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.closeRegionDrawer();
            });
        }
        // ESC 关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeRegionDrawer();
        });
    }

    openRegionDrawer() {
        const overlay = document.getElementById('regionDrawerOverlay');
        if (overlay) overlay.classList.add('show'), overlay.style.display = 'flex';
    }

    closeRegionDrawer() {
        const overlay = document.getElementById('regionDrawerOverlay');
        if (overlay) overlay.classList.remove('show'), overlay.style.display = 'none';
    }

    renderProductDetails() {
        const titleElement = document.getElementById('productGroupTitle');
        const taglineElement = document.getElementById('productTagline');
        const productsContainer = document.getElementById('productsGrid');

        if (!this.currentSecondGroup) {
            titleElement.textContent = '请选择产品类型';
            taglineElement.innerHTML = '';
            productsContainer.innerHTML = '';
            return;
        }

        const regionInfo = this.parseSecondGroupName(this.currentSecondGroup.name);
        
        // 更新标题和标语
        titleElement.textContent = regionInfo.name;
        taglineElement.innerHTML = this.currentSecondGroup.tagline || '';

        // 渲染产品卡片
        this.renderProducts();
    }

    renderProducts() {
        const container = document.getElementById('productsGrid');
        container.innerHTML = '';

        if (!this.currentSecondGroup || !this.currentSecondGroup.products) {
            container.innerHTML = '<p>暂无产品</p>';
            return;
        }

        this.currentSecondGroup.products.forEach(product => {
            const card = this.createProductCard(product);
            container.appendChild(card);
        });
    }

    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // 解析HTML描述
        const description = this.parseHtmlDescription(product.description);
        
        card.innerHTML = `
            <div class="product-id">#${product.id}</div>
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">¥${product.product_price}</div>
            <div class="product-description">${description}</div>
            <button class="order-button" onclick="productSelector.orderProduct(${product.id})">
                立即订购
            </button>
        `;
        
        return card;
    }

    parseHtmlDescription(htmlString) {
        if (!htmlString) return '暂无描述';
        
        try {
            // 解码HTML实体
            const decoded = htmlString
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
                    return String.fromCharCode(parseInt(hex, 16));
                })
                .replace(/&#(\d+);/g, (match, dec) => {
                    return String.fromCharCode(parseInt(dec, 10));
                });
            
            return decoded;
        } catch (error) {
            console.warn('HTML解析失败:', error);
            return htmlString;
        }
    }

    orderProduct(productId) {
        const orderUrl = `https://app1.xuanyiy.cn/cart?action=configureproduct&pid=${productId}`;
        
        // 添加点击动画效果
        const button = event.target;
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
        
        // 嵌入跳转，保留导航栏
        this.embedRedirect(orderUrl);
    }

    embedRedirect(url) {
        // 创建嵌入容器
        const embedContainer = document.createElement('div');
        embedContainer.id = 'embed-container';
        embedContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(5px);
        `;

        // 创建嵌入窗口
        const embedWindow = document.createElement('div');
        embedWindow.style.cssText = `
            width: 95%;
            height: 90%;
            max-width: 1200px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        // 创建头部导航栏（保留原有导航栏）
        const embedHeader = document.createElement('div');
        embedHeader.style.cssText = `
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 105, 180, 0.2);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
        `;

        embedHeader.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <a href="https://app1.xuanyiy.cn" style="display: flex; align-items: center;">
                    <img src="https://app1.xuanyiy.cn/upload/logo-colours.png" alt="Logo" style="height: 35px;">
                </a>
                <span style="color: #333; font-weight: 600;">产品订购</span>
            </div>
            <button id="closeEmbed" style="
                background: rgba(255, 105, 180, 0.1);
                border: 1px solid rgba(255, 105, 180, 0.3);
                color: #ff69b4;
                padding: 8px 12px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
            ">关闭</button>
        `;

        // 创建iframe容器
        const iframeContainer = document.createElement('div');
        iframeContainer.style.cssText = `
            flex: 1;
            overflow: hidden;
            position: relative;
        `;

        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 0 0 15px 15px;
        `;

        // 组装嵌入窗口
        iframeContainer.appendChild(iframe);
        embedWindow.appendChild(embedHeader);
        embedWindow.appendChild(iframeContainer);
        embedContainer.appendChild(embedWindow);

        // 添加到页面
        document.body.appendChild(embedContainer);
        document.body.style.overflow = 'hidden';

        // 绑定关闭事件
        const closeBtn = document.getElementById('closeEmbed');
        closeBtn.addEventListener('click', () => {
            this.closeEmbed();
        });

        // 点击背景关闭
        embedContainer.addEventListener('click', (e) => {
            if (e.target === embedContainer) {
                this.closeEmbed();
            }
        });

        // ESC键关闭
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeEmbed();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    closeEmbed() {
        const embedContainer = document.getElementById('embed-container');
        if (embedContainer) {
            embedContainer.remove();
            document.body.style.overflow = 'auto';
        }
    }

    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2ed573;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
        `;
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                successDiv.remove();
            }, 300);
        }, 3000);
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 初始化应用
let productSelector;
document.addEventListener('DOMContentLoaded', () => {
    productSelector = new ProductSelector();
});

// 错误处理
window.addEventListener('error', (event) => {
    console.error('页面错误:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', event.reason);
});

