import Modal from "./Modal"

function TermsModal({ isOpen, onAccept, onReject }) {

    return (
        <Modal isOpen={isOpen}>
            <div className="modal-card terms-modal">

                <h2 className="terms-title">
                    Termo de Consentimento
                </h2>

                <div className="terms-content">

                    <p>
                        O NEXTAGE é parte de um Trabalho de Conclusão de Curso (TCC)
                        voltado ao estudo do raciocínio lógico e da tomada de decisão
                        em jogos do tipo puzzle.
                    </p>

                    <p>
                        Ao aceitar este termo, você concorda que dados anônimos relacionados
                        ao seu desempenho no jogo poderão ser coletados e analisados
                        exclusivamente para fins acadêmicos.
                    </p>

                    <p>
                        Entre as métricas analisadas estão:
                    </p>

                    <ul>
                        <li>Tempo médio gasto para acertar palavras</li>
                        <li>Média de tentativas até o acerto</li>
                        <li>Sequência de vitórias</li>
                        <li>Pontuação no modo Runner</li>
                        <li>Classificação de perfil (iniciante, médio ou avançado)</li>
                    </ul>

                    <p>
                        Nenhuma informação sensível ou dado pessoal identificável será divulgado.
                        Todas as análises serão realizadas de forma agregada e anônima.
                    </p> <br />

                    <p>
                        Este projeto é conduzido por Taagny Augusto como parte
                        do curso de Ciência da Computação da Centro Universitário Presidente Antônio Carlos (UNIPAC).
                    </p>

                    <p className="terms-highlight">
                        Sua participação é voluntária e você pode interromper o uso do sistema a qualquer momento.
                    </p>

                </div>

                <div className="terms-actions">
                    <button className="terms-btn accept" onClick={onAccept}>
                        Aceito
                    </button>

                    <button className="terms-btn reject" onClick={onReject}>
                        Não Aceito
                    </button>
                </div>

            </div>
        </Modal>
    )
}

export default TermsModal