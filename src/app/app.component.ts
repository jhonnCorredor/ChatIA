import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { key } from '../key';
import { GoogleGeminiProService } from './services/google-gemini-pro.service';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  title = 'ng-gemini-test';
  @ViewChild('scrollframe') scrollframe?: ElementRef;
  scroll() {
    const maxScroll = this.scrollframe?.nativeElement.scrollHeight;
    this.scrollframe?.nativeElement.scrollTo({ top: maxScroll, behavior: 'smooth' });
  }

  result = '';
  prompt = '';
  writing = false;

  questions: Array<{ prompt: string; result: string }> = [];

  constructor(private googleGeminiPro: GoogleGeminiProService) {
    this.googleGeminiPro.initialize(key);
  }

  async generate() {
    this.writing = true;
    const result = await this.googleGeminiPro.generateText(this.prompt);

    const formattedResult = result
      .replace(/(\|[^\n]*\|)(\n)(\|[-:]+[-|:]*\|)(\n)((\|[^\n]*\|)(\n)?)+/g, (match: string) => {
        const rows = match.split('\n').filter(row => row.trim() !== '');

        const headers = rows[0].split('|').slice(1, -1).map(header => header.trim()).join('</th><th>');
        const headerRow = `<tr><th>${headers}</th></tr>`;

        const bodyRows = rows.slice(2).map(row => {
          const cols = row.split('|').slice(1, -1).map(col => `<td>${col.trim()}</td>`).join('');
          return `<tr>${cols}</tr>`;
        }).join('');

        return `<table><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>`;
      })
      .replace(/```(.*?)```/gs, (match: any, code: string) => {
        return `<pre style=""><code>${this.escapeHtml(code)}</code></pre>`;
      })
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<li>$1</li>')
      ;

    this.questions.push({ prompt: this.prompt, result: formattedResult });
    this.write(formattedResult, 0);
  }




  write(result: string, index: number) {
    this.questions[this.questions.length - 1].result = result.slice(0, index);
    if (index < result.length) {
      setTimeout(() => {
        this.scroll();
        this.write(result, index + 1);
      }, this.randomVelocity());
    }
    else {
      this.writing = false;
      this.prompt = '';
    }
  }

  randomVelocity(): number {
    const velocity = Math.floor(Math.random() * 25 + 1);
    return velocity;
  }

  trackByPrompt(index: number, item: any): string {
    return item.prompt;
  }

  escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
  }

}