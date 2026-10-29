
import {
    _decorator,
    Component,
    Label,
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ScoreManager')
export class ScoreManager extends Component {

    @property(Label)
    scoreLabel: Label | null = null;

    @property
    correctPoints = 100;

    @property
    wrongPoints = 25;

    private currentScore = 0;

    get score(): number {
        return this.currentScore;
    }

    start() {
        this.updateScoreLabel();
    }

    addCorrectScore() {
        this.currentScore += this.correctPoints;
        this.updateScoreLabel();

        console.log(`Score: +${this.correctPoints} | Total: ${this.currentScore}`);
    }

    addWrongScore() {
        this.currentScore = Math.max(
            0,
            this.currentScore - this.wrongPoints
        );

        this.updateScoreLabel();

        console.log(`Score: -${this.wrongPoints} | Total: ${this.currentScore}`);
    }

    resetScore() {
        this.currentScore = 0;
        this.updateScoreLabel();
    }

    private updateScoreLabel() {
        if (this.scoreLabel) {
            this.scoreLabel.string = `Score: ${this.currentScore}`;
        }
    }
}
