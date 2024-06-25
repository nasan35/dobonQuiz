import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import './App.css';
import ConfirmModal from './ConfirmModal';

const App = () => {
  // ページタイトル
  const [question, setQuestion] = useState(null);
  // 選択肢
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [gridDimensions, setGridDimensions] = useState({ rows: 1, cols: 1 });
  // CSV取込
  const [csvLoaded, setCsvLoaded] = useState(false);
  const fileInputRef = useRef(null);
  // ゲーム開始状態
  const [gameStarted, setGameStarted] = useState(false);
  // クリア
  const [clickedIndex, setClickedIndex] = useState(null);
  // ポップアップメッセージ
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  // 確認ダイアログ
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showOpenConfirmModal, setShowOpenConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  // 残りドボン数
  const [dobonCount, setDobonCount] = useState(0);

  // 取り込んだCSVの行数によって選択肢の表示を動的に変える
  useEffect(() => {
    calculateGridDimensions(options.length);
  }, [options.length]);

  // CSV取込処理
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: false,
        complete: (results) => {
          // 1行目は問題文に代入して削除する
          setQuestion(results.data[0][0]);
          results.data.shift();
          // ドボン数をカウント
          results.data.forEach((row) => {
            if(row[1] === '1') {
              setDobonCount((dobonCount) => dobonCount + 1);
            }
          });
          // 選択肢を作成
          const loadedOptions = results.data.map((row) => ({
            text: row[0],
            isCorrect: row[1] === '0',
            clicked: false
          }));
          setOptions(loadedOptions);
          setCsvLoaded(true);
          setClickedIndex(null); 
          setGameStarted(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
        skipEmptyLines: true,
        error: (error) => {
          console.error('Error parsing CSV:', error);
        }
      });
    }
  };

  // 選択肢押下処理
  const handleOptionClick = (option, index) => {
    if (!gameStarted || option.clicked || option.text.trim() === '') {
      return;
    }

    setSelectedOption({ ...option, index });
    setConfirmMessage(`"${option.text}"でよろしいですか？`);
    setShowOpenConfirmModal(true);
  };

  // 正誤発表処理
  const handleConfirm = () => {
    const { isCorrect, index } = selectedOption;
    setShowOpenConfirmModal(false);
    setClickedIndex(index);
    setOptions(prevOptions =>
      prevOptions.map((option, idx) =>
        idx === index ? { ...option, clicked: true } : option
      )
    );
    setPopupMessage(isCorrect ? "正解" : "ドボン");
    setDobonCount(!isCorrect ? (dobonCount) => dobonCount - 1 : dobonCount);
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 2000);
  };

  // 選択肢押下ダイアログキャンセル
  const handleOpenCancel = () => {
    setShowOpenConfirmModal(false);
  };

  // クリア押下ダイアログキャンセル
  const handleClearCancel = () => {
    setShowClearConfirmModal(false);
  };

  // ゲーム開始
  const handleStartGame = () => {
    setGameStarted(true);
  };

  // ゲーム終了
  const handleEndGame = () => {
    setGameStarted(false);
  };

  // クリア押下処理
  const handleClearClick = () => {
    setConfirmMessage(`CSVインポート前に戻りますか？`);
    setShowClearConfirmModal(true);
  };

  // クリア処理
  const handleClearGame = () => {
    setShowClearConfirmModal(false);
    setOptions([]);
    setCsvLoaded(false);
    setGameStarted(false);
    setClickedIndex(null);
    setDobonCount(0);
  };

  // 選択肢の表示行列数計算処理
  const calculateGridDimensions = (numOptions) => {
    if(numOptions !== 0) {
      let cols = 1;
      let rows = 1;

      // 選択肢の数が5以下の場合
      if (numOptions <= 5) 
      {
        // 選択肢は1行で表示
        cols = numOptions;
        rows = 1;
      }
      // 選択肢の数が6の2乗以上の場合
      else if (numOptions >= 6 ** 2)
      {
        // 列数を6で固定し、行数は無制限
        cols = 6;
        rows = Math.ceil(numOptions / cols); 
      }
      // 上記以外の場合
      else
      {
        // 列数の算出
        while (cols ** 2  < numOptions) {
          cols++;
         }
        // 行数の算出
        rows = cols;
        while (!(cols * rows === options || cols * (rows - 1) < numOptions || cols - rows >= 3)) {
          rows--;
        }
      }
      // 行列数の確定
      setGridDimensions({ rows, cols });
    }
  };

  const renderOptions = () => {
  const { rows, cols } = gridDimensions;
  const optionsGrid = [];

  let visibleOptions = options.filter(option => option.text.trim() !== ''); // 空の選択肢をフィルタリング

  // 選択肢のグリッドを作成
  for (let row = 0; row < rows; row++) {
    const rowOptions = [];
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      if (index < visibleOptions.length) {
        const option = visibleOptions[index];
        rowOptions.push(
          <button
            key={index}
            onClick={() => handleOptionClick(option, index)}
            className={`option-button ${option.clicked ? (option.isCorrect ? 'correct' : 'wrong') : ''}`}
            style={{
              color: option.clicked && '#fff',
              textAlign: 'center'
            }}
            disabled={!gameStarted || option.clicked || option.text.trim() === ''}
          >
            {option.text}
          </button>
        );
      } else {
        rowOptions.push( // 空の選択肢の場合、ダミーボタンを挿入する
          <div key={index} style={{ width: '250px', height: '100px' }} />
        );
      }
    }
    optionsGrid.push(
      <div key={row} className="options-row" style={{ justifyContent: 'center' }}>
        {rowOptions}
      </div>
    );
  }
  return optionsGrid;
};

  return (
    <div className="App">
      <h1 className="title">ドボンクイズ</h1>
      {csvLoaded ? (
        /* CSVインポート後 */
        <div>
          <div className="question">{question}</div>
          <div className="dobonCounter">
            残りドボン数：{dobonCount}
          </div>
          <div className="controls">
            <button onClick={handleStartGame} disabled={!csvLoaded || gameStarted}>開始</button>
            <button onClick={handleEndGame} disabled={!gameStarted}>終了</button>
            <button onClick={handleClearClick} disabled={!csvLoaded || gameStarted}>クリア</button>
          </div>
          <div className="options-grid">
            {renderOptions()}
          </div>
        </div>
      ) : (
        /* CSVインポート前 */
        <div>
          <label>
            <input
              type="file"
              id="file-input"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              ref={fileInputRef}
           />
            <button
              className="importButton"
              type="button"
              disabled={csvLoaded}
              onClick={() => document.getElementById('file-input').click()}
            >
              CSVインポート
            </button>
          </label>
          <div style={{ marginTop: '20px', fontSize: '20px' }}>
            CSVのフォーマット
          </div>
          <div className="csvFormat">
              <div>&emsp;&emsp;1行目 : "問題文"</div>
              <div>2行目以降 : "選択肢", "ドボンフラグ"</div>
              <div style={{fontSize: '12px' }}>※ドボンフラグ = 1 の選択肢がドボンになります</div>
          </div>
        </div>
      )}
      {showPopup && <div className="popup">{popupMessage}</div>}
      {showOpenConfirmModal && (
        <ConfirmModal
          message={confirmMessage}
          onConfirm={handleConfirm}
          onCancel={handleOpenCancel}
        />
      )}
      {showClearConfirmModal && (
        <ConfirmModal
          message={confirmMessage}
          onConfirm={handleClearGame}
          onCancel={handleClearCancel}
        />
      )}
    </div>
  );
};

export default App;
