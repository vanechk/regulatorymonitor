# 🛡️ Настройка защиты веток GitHub

## 📋 Настройки для main ветки

### В GitHub репозитории:
1. Перейдите в Settings → Branches
2. Нажмите "Add rule" для `main`
3. Настройте следующие правила:

#### ✅ Require a pull request before merging
- Require approvals: **2** (минимум 2 ревью)
- Dismiss stale PR approvals when new commits are pushed
- Require review from code owners

#### ✅ Require status checks to pass before merging
- Require branches to be up to date before merging
- Status checks: `test`, `lint`, `build`

#### ✅ Require conversation resolution before merging
- Require all conversations on code to be resolved

#### ✅ Restrict pushes that create files that are larger than 100 MB

#### ✅ Include administrators
- Apply these rules to administrators too

## 📋 Настройки для develop ветки

1. Создайте правило для `develop`
2. Настройте следующие правила:

#### ✅ Require a pull request before merging
- Require approvals: **1** (минимум 1 ревью)
- Dismiss stale PR approvals when new commits are pushed

#### ✅ Require status checks to pass before merging
- Require branches to be up to date before merging
- Status checks: `test`, `lint`

#### ✅ Allow force pushes
- Разрешить принудительные пуши для develop

## 🚨 Важно!
После настройки защиты веток:
- НЕЛЬЗЯ будет мержить напрямую в main
- Все изменения должны проходить через Pull Request
- Обязательно code review перед мержем
