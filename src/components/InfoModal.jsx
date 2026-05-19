import Modal from "./Modal"

function InfoModal({ isOpen, onClose }) {

    return (
        <Modal isOpen={isOpen}>
            <div className="info-card">

                <button className="info-close" onClick={onClose}>
                    ×
                </button>

                <h1 className="info-title">
                    COMO JOGAR
                </h1>

                <div className="info-example">
                    <div className="info-row">
                        <div className="tile-example correct">P</div>
                        <div className="tile-example">O</div>
                        <div className="tile-example">D</div>
                        <div className="tile-example">A</div>
                        <div className="tile-example">M</div>
                    </div>
                    <p>A letra P está na posição correta.</p>
                </div>

                <div className="info-example">
                    <div className="info-row">
                        <div className="tile-example">T</div>
                        <div className="tile-example">R</div>
                        <div className="tile-example">E</div>
                        <div className="tile-example">N</div>
                        <div className="tile-example present">S</div>
                    </div>
                    <p>A letra S está na palavra mas não na posição correta.</p>
                </div>

                <div className="info-example">
                    <div className="info-row">
                        <div className="tile-example absent">F</div>
                        <div className="tile-example absent">O</div>
                        <div className="tile-example absent">N</div>
                        <div className="tile-example absent">T</div>
                        <div className="tile-example absent">E</div>
                    </div>
                    <p>Letras cinza não estão na palavra.</p>
                </div>

                <hr className="info-divider" />

                <h2 className="info-subtitle">Sobre</h2>

                <p className="info-about">
                    NEXTAGE é uma versão baseada no charada.app <br />
                    Me chamo Taagny Augusto, comecei a criar conteúdo desse tipo <br />
                    de jogo e resolvi criar o meu próprio. <br />
                    ESPERO QUE GOSTEM !!!
                </p>

                <div className="info-socials">

                    <a
                        href="https://instagram.com/taagny_augusto"
                        target="_blank"
                        rel="noreferrer"
                        className="social-btn instagram"
                    >
                        <svg viewBox="0 0 24 24" className="social-svg">
                            <path fill="white" d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 2A3.75 3.75 0 0 0 4 7.75v8.5A3.75 3.75 0 0 0 7.75 20h8.5A3.75 3.75 0 0 0 20 16.25v-8.5A3.75 3.75 0 0 0 16.25 4Zm4.25 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm4.25-.88a1.13 1.13 0 1 1-2.25 0 1.13 1.13 0 0 1 2.25 0Z" />
                        </svg>
                        Instagram
                    </a>

                    <a
                        href="https://tiktok.com/@meunometaagny"
                        target="_blank"
                        rel="noreferrer"
                        className="social-btn tiktok"
                    >
                        <svg viewBox="0 0 24 24" className="social-svg">
                            <path fill="white" d="M12.5 2h2.2c.2 1.8 1.5 3.2 3.3 3.4v2.2c-1.3 0-2.6-.4-3.7-1.2v6.4a4.8 4.8 0 1 1-4.8-4.8c.3 0 .6 0 .9.1v2.4a2.5 2.5 0 1 0 2.1 2.5V2Z" />
                        </svg>
                        TikTok
                    </a>

                    <a
                        href="https://livepix.gg/taagny"
                        target="_blank"
                        rel="noreferrer"
                        className="social-btn livepix"
                    >
                        <svg viewBox="0 0 24 24" className="social-svg">
                            <path fill="white" d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                        </svg>
                        LivePix
                    </a>

                </div>

            </div>
        </Modal>
    )
}

export default InfoModal