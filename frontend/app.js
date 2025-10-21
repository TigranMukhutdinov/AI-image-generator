const API_URL = 'http://localhost:8000';
let currentToken = '';
let currentTheme = '';

function setExample(theme) {
    const input = document.getElementById('themeInput') || document.getElementById('userThemeInput');
    input.value = theme;
    generateImage();
}

async function generateImage() {
    let input;
    if (document.getElementById('userInterface').style.display !== 'none') {
        input = document.getElementById('userThemeInput');
    } else {
        input = document.getElementById('themeInput');
    }
    
    const theme = input.value.trim();
    if (!theme) {
        alert('Введите описание для изображения');
        return;
    }

    currentTheme = theme;
    
    showElement('loading');
    hideElement('resultSection');
    hideElement('savedSection');

    try {
        const response = await fetch(`${API_URL}/generate-image/?theme=${encodeURIComponent(theme)}`);
        
        if (!response.ok) throw new Error('Ошибка сервера');

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        
        document.getElementById('generatedImage').src = imageUrl;
        
        hideElement('loading');
        showElement('resultSection');
        
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.style.display = currentToken ? 'block' : 'none';
        
    } catch (error) {
        hideElement('loading');
        alert('Ошибка при генерации изображения');
    }
}

function downloadImage() {
    const image = document.getElementById('generatedImage');
    const link = document.createElement('a');
    link.href = image.src;
    link.download = `ai-image-${currentTheme || 'image'}.png`;
    link.click();
}

function showAuth() {
    hideElement('guestInterface');
    showElement('authSection');
}

async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    if (!username || !password) {
        alert('Заполните все поля');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/login/?username=${username}&password=${password}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            currentToken = username;
            showUserInterface();
        } else {
            alert('Неверные данные');
        }
    } catch (error) {
        alert('Ошибка соединения');
    }
}

async function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    
    if (!username || !password) {
        alert('Заполните все поля');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/register/?username=${username}&password=${password}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            alert('Регистрация успешна! Войдите в систему.');
            showAuthForm('login');
        } else {
            alert('Ошибка регистрации');
        }
    } catch (error) {
        alert('Ошибка соединения');
    }
}

function showUserInterface() {
    hideElement('authSection');
    hideElement('guestInterface');
    showElement('userInterface');
    document.getElementById('usernameDisplay').textContent = currentToken;
    
    const guestInput = document.getElementById('themeInput');
    const userInput = document.getElementById('userThemeInput');
    if (guestInput.value) {
        userInput.value = guestInput.value;
    }
}

function logout() {
    currentToken = '';
    hideElement('userInterface');
    hideElement('resultSection');
    hideElement('savedSection');
    hideElement('passwordSection');
    showElement('guestInterface');
    
    const guestInput = document.getElementById('themeInput');
    const userInput = document.getElementById('userThemeInput');
    if (userInput.value) {
        guestInput.value = userInput.value;
    }
}

function showAuthForm(formType) {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.remove('active');
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    
    if (formType === 'login') {
        document.getElementById('loginForm').classList.add('active');
        document.querySelectorAll('.auth-tab')[0].classList.add('active');
    } else {
        document.getElementById('registerForm').classList.add('active');
        document.querySelectorAll('.auth-tab')[1].classList.add('active');
    }
}
// Смена пароля
function showPasswordSection() {
    hideElement('userInterface');
    hideElement('savedSection');
    hideElement('resultSection');
    showElement('passwordSection');
    
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    hidePasswordMessage();
}

async function updatePassword() {
    const currentPassword = document.getElementById('currentPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showPasswordMessage('Заполните все поля', 'error');
        return;
    }
    
    if (newPassword.length < 3) {
        showPasswordMessage('Пароль должен быть не менее 3 символов', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showPasswordMessage('Пароли не совпадают', 'error');
        return;
    }
    
    try {
        const response = await fetch(
            `${API_URL}/update-password/?current_password=${currentPassword}&new_password=${newPassword}`, 
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            }
        );
        
        if (response.ok) {
            showPasswordMessage('Пароль успешно обновлен', 'success');
            setTimeout(() => {
                hidePasswordMessage();
                showMainInterface();
            }, 2000);
        } else {
            const error = await response.json();
            showPasswordMessage(error.detail || 'Ошибка', 'error');
        }
    } catch (error) {
        showPasswordMessage('Ошибка соединения', 'error');
    }
}

function showPasswordMessage(message, type) {
    const messageElement = document.getElementById('passwordMessage');
    messageElement.textContent = message;
    messageElement.className = type;
    messageElement.style.display = 'block';
}

function hidePasswordMessage() {
    document.getElementById('passwordMessage').style.display = 'none';
}
async function saveCurrentImage() {
    if (!currentToken) {
        showAuth();
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/save-image/?theme=${currentTheme}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            alert('Изображение сохранено!');
        } else {
            alert('Ошибка сохранения');
        }
    } catch (error) {
        alert('Ошибка соединения');
    }
}

async function showSavedImages() {
    try {
        const response = await fetch(`${API_URL}/saved-images/`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const savedImages = await response.json();
            displaySavedImages(savedImages);
            hideElement('resultSection');
            hideElement('userInterface');
            showElement('savedSection');
        }
    } catch (error) {
        alert('Ошибка загрузки');
    }
}

function displaySavedImages(images) {
    const grid = document.getElementById('savedImagesGrid');
    grid.innerHTML = '';
    
    images.forEach(image => {
        const card = document.createElement('div');
        card.className = 'saved-image-card';
        card.innerHTML = `
            <img src="${API_URL}${image.image_url}" class="saved-image" alt="${image.theme}">
            <div>${image.theme}</div>
            <button class="action-btn" onclick="deleteSavedImage(${image.id})" style="margin-top: 8px; background: #e53e3e;">Удалить</button>
        `;
        grid.appendChild(card);
    });
}

async function deleteSavedImage(imageId) {
    if (!confirm('Удалить изображение?')) return;
    
    try {
        const response = await fetch(`${API_URL}/saved-images/${imageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            showSavedImages();
        }
    } catch (error) {
        alert('Ошибка удаления');
    }
}

function showMainInterface() {
    hideElement('savedSection');
    hideElement('passwordSection');
    showElement('userInterface');
}

function showElement(id) {
    document.getElementById(id).style.display = 'block';
}

function hideElement(id) {
    document.getElementById(id).style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    const inputs = ['themeInput', 'userThemeInput'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') generateImage();
            });
        }
    });
});
