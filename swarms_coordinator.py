#!/usr/bin/env python3
"""
Swarms Communication Coordinator for Terminal App Debugging
Integrates Python swarms with Claude Flow coordination hooks
"""

import os
import json
import subprocess
import sqlite3
from datetime import datetime
from typing import Dict, List, Any, Optional
from swarms_config import create_terminal_debug_swarm, TerminalDebugSwarm


class SwarmsClaudeFlowCoordinator:
    """Coordinates Python swarms with Claude Flow memory and hooks"""
    
    def __init__(self, memory_db_path: str = ".swarm/memory.db"):
        self.memory_db_path = memory_db_path
        self.swarm: Optional[TerminalDebugSwarm] = None
        self.coordination_log: List[Dict[str, Any]] = []
        
    def initialize_swarm(self) -> bool:
        """Initialize the debugging swarm with Claude Flow coordination"""
        try:
            print("🚀 Initializing Python Swarms with Claude Flow coordination...")
            
            # Create the swarm
            self.swarm = create_terminal_debug_swarm()
            
            # Register swarm initialization with Claude Flow
            self._claude_flow_hook("notify", {
                "message": f"Python swarms initialized with {len(self.swarm.agents)} agents",
                "level": "success"
            })
            
            # Store swarm metadata in Claude Flow memory
            swarm_metadata = {
                "initialized_at": datetime.now().isoformat(),
                "agent_count": len(self.swarm.agents),
                "agent_names": [agent.agent_name for agent in self.swarm.agents],
                "coordination_type": "parallel_debugging"
            }
            
            self._store_coordination_memory("swarms/metadata", swarm_metadata)
            
            print(f"✅ Swarm initialized with {len(self.swarm.agents)} specialized debugging agents")
            return True
            
        except Exception as e:
            print(f"❌ Failed to initialize swarm: {e}")
            self._claude_flow_hook("notify", {
                "message": f"Swarm initialization failed: {str(e)}",
                "level": "error"
            })
            return False
    
    def coordinate_debugging_session(self, issue_description: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Run a coordinated debugging session with Claude Flow integration"""
        
        if not self.swarm:
            print("❌ Swarm not initialized. Call initialize_swarm() first.")
            return {"error": "Swarm not initialized"}
        
        session_id = f"debug-session-{int(datetime.now().timestamp())}"
        
        print(f"🔍 Starting coordinated debugging session: {session_id}")
        
        # Pre-task hook with Claude Flow
        self._claude_flow_hook("pre-task", {
            "description": f"Swarms debugging session: {issue_description[:100]}...",
            "task-id": session_id
        })
        
        # Load previous debugging context from Claude Flow memory
        previous_context = self._load_coordination_memory("swarms/debugging/context")
        if previous_context:
            print("📚 Loaded previous debugging context from memory")
            context = {**(context or {}), "previous_findings": previous_context}
        
        # Run coordinated debugging
        debug_results = self.swarm.coordinate_debugging(issue_description)
        
        # Store debugging results in coordination memory
        session_data = {
            "session_id": session_id,
            "issue": issue_description,
            "timestamp": datetime.now().isoformat(),
            "agent_results": debug_results,
            "context": context or {}
        }
        
        self._store_coordination_memory(f"swarms/debugging/sessions/{session_id}", session_data)
        
        # Generate coordinated solution
        solution = self.swarm.generate_coordinated_solution(debug_results)
        session_data["coordinated_solution"] = solution
        
        # Post-task hook with results
        self._claude_flow_hook("post-task", {
            "task-id": session_id,
            "track-metrics": True,
            "store-results": True
        })
        
        # Notify coordination completion
        self._claude_flow_hook("notify", {
            "message": f"Debugging session completed: {len(debug_results)} agents participated",
            "level": "success"
        })
        
        print(f"✅ Coordinated debugging session completed")
        print(f"📊 {len(debug_results)} agents provided analysis")
        print(f"🎯 Solution generated and stored in memory")
        
        return session_data
    
    def get_coordination_status(self) -> Dict[str, Any]:
        """Get current coordination status between swarms and Claude Flow"""
        
        status = {
            "swarm_initialized": self.swarm is not None,
            "agent_count": len(self.swarm.agents) if self.swarm else 0,
            "coordination_log_entries": len(self.coordination_log),
            "memory_db_exists": os.path.exists(self.memory_db_path)
        }
        
        if self.swarm:
            status["agent_names"] = [agent.agent_name for agent in self.swarm.agents]
        
        # Get debugging sessions from memory
        sessions = self._load_coordination_memory("swarms/debugging/sessions") or {}
        status["debugging_sessions"] = len(sessions) if isinstance(sessions, dict) else 0
        
        return status
    
    def communicate_with_claude_agents(self, message: str, target_agent: str = "all") -> Dict[str, Any]:
        """Send communication to Claude Flow agents through memory coordination"""
        
        communication_data = {
            "timestamp": datetime.now().isoformat(),
            "from": "python_swarms",
            "to": target_agent,
            "message": message,
            "session_active": self.swarm is not None
        }
        
        # Store communication in shared memory
        comm_key = f"swarms/communication/{int(datetime.now().timestamp())}"
        self._store_coordination_memory(comm_key, communication_data)
        
        # Send notification through Claude Flow
        self._claude_flow_hook("notify", {
            "message": f"Swarms communication to {target_agent}: {message[:50]}...",
            "level": "info"
        })
        
        print(f"📡 Communication sent to {target_agent}: {message}")
        
        return communication_data
    
    def _claude_flow_hook(self, hook_name: str, params: Dict[str, Any]) -> bool:
        """Execute Claude Flow hooks for coordination"""
        try:
            cmd_parts = ["npx", "claude-flow@alpha", "hooks", hook_name]
            
            for key, value in params.items():
                cmd_parts.extend([f"--{key}", str(value)])
            
            result = subprocess.run(cmd_parts, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                self.coordination_log.append({
                    "timestamp": datetime.now().isoformat(),
                    "hook": hook_name,
                    "params": params,
                    "success": True,
                    "output": result.stdout
                })
                return True
            else:
                print(f"⚠️ Claude Flow hook '{hook_name}' failed: {result.stderr}")
                self.coordination_log.append({
                    "timestamp": datetime.now().isoformat(),
                    "hook": hook_name,
                    "params": params,
                    "success": False,
                    "error": result.stderr
                })
                return False
                
        except Exception as e:
            print(f"❌ Error executing Claude Flow hook '{hook_name}': {e}")
            return False
    
    def _store_coordination_memory(self, key: str, data: Any) -> bool:
        """Store data in Claude Flow coordination memory"""
        try:
            # Ensure .swarm directory exists
            os.makedirs(".swarm", exist_ok=True)
            
            # Store in SQLite database (Claude Flow format)
            with sqlite3.connect(self.memory_db_path) as conn:
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS memory_store (
                        key TEXT PRIMARY KEY,
                        value TEXT,
                        timestamp TEXT,
                        ttl INTEGER
                    )
                ''')
                
                conn.execute('''
                    INSERT OR REPLACE INTO memory_store (key, value, timestamp, ttl)
                    VALUES (?, ?, ?, ?)
                ''', (key, json.dumps(data), datetime.now().isoformat(), None))
                
                conn.commit()
            return True
            
        except Exception as e:
            print(f"❌ Failed to store coordination memory: {e}")
            return False
    
    def _load_coordination_memory(self, key: str) -> Any:
        """Load data from Claude Flow coordination memory"""
        try:
            if not os.path.exists(self.memory_db_path):
                return None
                
            with sqlite3.connect(self.memory_db_path) as conn:
                cursor = conn.execute('SELECT value FROM memory_store WHERE key = ?', (key,))
                row = cursor.fetchone()
                
                if row:
                    return json.loads(row[0])
                return None
                
        except Exception as e:
            print(f"❌ Failed to load coordination memory: {e}")
            return None


def main():
    """Main function to test swarms coordination"""
    print("🚀 Testing Python Swarms + Claude Flow Coordination")
    
    coordinator = SwarmsClaudeFlowCoordinator()
    
    # Initialize swarm
    if coordinator.initialize_swarm():
        print("✅ Swarm initialization successful")
        
        # Test coordination status
        status = coordinator.get_coordination_status()
        print(f"📊 Coordination Status: {status}")
        
        # Test communication
        coordinator.communicate_with_claude_agents(
            "Python swarms ready for coordinated debugging",
            "all"
        )
        
        # Test debugging session
        test_issue = """
        Mobile terminal interface showing rendering issues:
        - Tab navigation broken on touch devices
        - Terminal output viewport not responsive
        - Gesture controls not registering
        - Performance degradation on mobile browsers
        """
        
        session_result = coordinator.coordinate_debugging_session(test_issue)
        print(f"🔍 Debugging session: {session_result['session_id']}")
        
        print("✅ Swarms coordination test completed successfully")
        
    else:
        print("❌ Swarm initialization failed")


if __name__ == "__main__":
    main()