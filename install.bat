@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ================================================================
echo   業務改善システム自動具体化ツール - 自動インストーラー
echo ================================================================
echo.

:: 管理者権限チェック
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] 管理者権限で実行中
) else (
    echo [!] 管理者権限が必要です。右クリックして「管理者として実行」してください。
    pause
    exit /b 1
)

:: Node.js インストールチェック
echo [1/5] Node.js の確認中...
node --version >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] Node.js が既にインストールされています
    node --version
) else (
    echo [!] Node.js がインストールされていません。自動インストールを開始します...
    
    :: Node.js LTS版のダウンロード
    echo Node.js LTS版をダウンロード中...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi' -OutFile 'nodejs_installer.msi'}"
    
    if exist nodejs_installer.msi (
        echo Node.js インストール中... （この処理には数分かかります）
        msiexec /i nodejs_installer.msi /quiet /norestart
        
        :: パス更新のため新しいセッションでNode.jsを確認
        timeout /t 10 /nobreak >nul
        refreshenv
        
        node --version >nul 2>&1
        if !errorLevel! == 0 (
            echo [✓] Node.js インストール完了
            del nodejs_installer.msi
        ) else (
            echo [×] Node.js の自動インストールに失敗しました
            echo 手動で https://nodejs.org からインストールしてください
            pause
            exit /b 1
        )
    ) else (
        echo [×] Node.js のダウンロードに失敗しました
        echo インターネット接続を確認してください
        pause
        exit /b 1
    )
)

:: npm の更新
echo.
echo [2/5] npm を最新版に更新中...
npm install -g npm@latest
if %errorLevel% == 0 (
    echo [✓] npm 更新完了
) else (
    echo [!] npm の更新をスキップします（既存版を使用）
)

:: 依存関係のインストール
echo.
echo [3/5] プロジェクト依存関係をインストール中...
if exist package.json (
    npm install
    if %errorLevel% == 0 (
        echo [✓] 依存関係インストール完了
    ) else (
        echo [×] 依存関係のインストールに失敗しました
        echo package.json を確認してください
        pause
        exit /b 1
    )
) else (
    echo [×] package.json が見つかりません
    echo 正しいディレクトリで実行してください
    pause
    exit /b 1
)

:: ファイアウォール設定
echo.
echo [4/5] ファイアウォール設定の確認中...
netsh advfirewall firewall show rule name="Node.js Server" >nul 2>&1
if %errorLevel% == 0 (
    echo [✓] ファイアウォール設定済み
) else (
    echo ファイアウォール例外を追加中...
    netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=5173
    if %errorLevel% == 0 (
        echo [✓] ファイアウォール設定完了
    ) else (
        echo [!] ファイアウォール設定をスキップします
    )
)

:: 開発サーバー起動
echo.
echo [5/5] 開発サーバーを起動中...
echo ブラウザが自動で開きます... 
echo.
echo ================================================================
echo   セットアップ完了！
echo   ブラウザで http://localhost:5173 にアクセスしてください
echo   終了するには Ctrl+C を押してください
echo ================================================================
echo.

:: ブラウザを開く（少し遅延を入れて）
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"

:: 開発サーバー起動
npm run dev

:: サーバー終了時のメッセージ
echo.
echo サーバーが停止されました。
echo 再度起動するには以下のコマンドを実行してください:
echo npm run dev
echo.
pause
