package main

import (
	"fmt"
	"os"
	"os/exec"

	tea "github.com/charmbracelet/bubbletea"
)

// 1. MODEL (State)
// We store the output of the git command and any errors.
type model struct {
	gitOutput string
	err       error
}

// 2. INIT (Initial Command)
// This functions fires as soon as the app starts.
// We trigger the gitLog command immediately.
func (m model) Init() tea.Cmd {
	return getGitLog
}

// 3. UPDATE (Event Handler)
// Handles keypresses and results from commands.
func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {

	// Is the message a KeyPress?
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "ctrl+c":
			return m, tea.Quit // Quit the app
		case "r":
			return m, getGitLog // Reload the log
		}

	// Did our 'getGitLog' function finish?
	case logMsg:
		m.gitOutput = string(msg) // Update state with the git output
		return m, nil

	// Did we get an error?
	case error:
		m.err = msg
		return m, nil
	}

	return m, nil
}

// 4. VIEW (UI)
// Renders the UI string based on the current state.
func (m model) View() string {
	if m.err != nil {
		return fmt.Sprintf("Error: %v", m.err)
	}
	if m.gitOutput == "" {
		return "Loading git history..."
	}

	// Header + Git Output + Footer
	s := "--- GitKraken-ish CLI (Press 'q' to quit, 'r' to refresh) ---\n\n"
	s += m.gitOutput
	s += "\n\n"
	return s
}

// --- COMMANDS (Side Effects) ---

// We define a custom message type just for the log data
type logMsg string

// This function runs the actual shell command
func getGitLog() tea.Msg {
	// We run 'git log' with specific formatting to make it look like a graph
	// --graph: draws the lines
	// --oneline: compact view
	// --all: shows all branches
	// --color=always: forces color output so Bubble Tea renders it nicely
	cmd := exec.Command("git", "log", "--graph", "--oneline", "--all", "--color=always")
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return err
	}
	return logMsg(output)
}

func main() {
	p := tea.NewProgram(model{})
	if _, err := p.Run(); err != nil {
		fmt.Printf("Alas, there's been an error: %v", err)
		os.Exit(1)
	}
}