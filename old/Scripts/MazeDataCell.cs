using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace Assets.Scripts {
    public struct MazeDataCell {
        public readonly int Row;
        public readonly int Col;
        private bool _wallT;
        private bool _wallB;
        private bool _wallL;
        private bool _wallR;

        public MazeDataCell(int r, int c) {
            Row = r;
            Col = c;
            _wallT = _wallB = _wallL = _wallR = true;
        }

        public void Reset() {
            _wallT = _wallB = _wallL = _wallR = true;
        }

        public bool HasTopWall() {
            return _wallT;
        }
        public bool HasBottomWall() {
            return _wallB;
        }
        public bool HasLeftWall() {
            return _wallL;
        }
        public bool HasRightWall() {
            return _wallR;
        }

        public void RemoveTopWall() {
            this._wallT = false;
        }
        public void RemoveBottomWall() {
            this._wallB = false;
        }
        public void RemoveLeftWall() {
            this._wallL = false;
        }
        public void RemoveRightWall() {
            this._wallR = false;
        }
    }
}